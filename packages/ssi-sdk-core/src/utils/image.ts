import fetch from 'cross-fetch'
import {imageSize} from 'image-size'
import { IImageDimensions, IImageResource } from '../types'

type SizeCalculationResult = {
  width: number | undefined
  height: number | undefined
  orientation?: number
  type?: string
}

export const getImageMediaType = async (base64: string): Promise<string | undefined> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  const result: SizeCalculationResult = imageSize(buffer)

  switch (result.type) {
    case undefined:
      return undefined
    case 'svg':
      return `image/${result.type}+xml`
    default:
      return `image/${result.type}`
  }
}

export const getImageDimensions = async (base64: string): Promise<IImageDimensions> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  const dimensions: SizeCalculationResult = imageSize(buffer)

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
