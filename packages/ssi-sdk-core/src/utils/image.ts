import fetch from 'cross-fetch'
import { imageSize } from 'image-size'
import { IImageDimensions, IImageResource } from '../types'

type SizeCalculationResult = {
  width?: number
  height?: number
  orientation?: number
  type?: string
}

const uint8ArrayToString = (uint8Array: Uint8Array): string => {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(uint8Array)
}

// TODO: here we're handling svg separately, remove this section when image-size starts supporting it in version 2
const isSvg = (uint8Array: Uint8Array): boolean => {
  const text = uint8ArrayToString(uint8Array)
  const normalizedText = text.trim().toLowerCase()
  return normalizedText.startsWith('<svg') || normalizedText.startsWith('<?xml')
}

const getSvgDimensions = (uint8Array: Uint8Array) => {
  const svgContent = uint8ArrayToString(uint8Array)
  const widthMatch = svgContent.match(/width="([^"]+)"/)
  const heightMatch = svgContent.match(/height="([^"]+)"/)
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/)

  let width, height

  if (widthMatch) {
    width = widthMatch[1]
  }

  if (heightMatch) {
    height = heightMatch[1]
  }

  if ((!width || !height) && viewBoxMatch) {
    const parts = viewBoxMatch[1].split(' ').map(Number)
    if (!width && parts.length === 4) {
      width = parts[2].toString()
    }
    if (!height && parts.length === 4) {
      height = parts[3].toString()
    }
  }

  return { width: Number(width), height: Number(height), type: 'svg' }
}

export const getImageMediaType = async (base64: string): Promise<string | undefined> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  if (isSvg(buffer)) {
    return `image/svg+xml`
  }
  const result: SizeCalculationResult = imageSize(buffer)
  return `image/${result.type}`
}

export const getImageDimensions = async (base64: string): Promise<IImageDimensions> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  const dimensions: SizeCalculationResult = isSvg(buffer) ? getSvgDimensions(buffer) : imageSize(buffer)

  if (!dimensions.width || !dimensions.height) {
    return Promise.reject(Error('Unable to get image dimensions'))
  }

  return { width: dimensions.width, height: dimensions.height }
}

export const downloadImage = async (url: string): Promise<IImageResource> => {
  const response: Response = await fetch(url)
  if (!response.ok) {
    return Promise.reject(Error(`Failed to download resource. Status: ${response.status} ${response.statusText}`))
  }

  const contentType: string | null = response.headers.get('Content-Type')
  const base64Content: string = Buffer.from(await response.arrayBuffer()).toString('base64')

  return {
    base64Content,
    contentType: contentType || undefined,
  }
}
