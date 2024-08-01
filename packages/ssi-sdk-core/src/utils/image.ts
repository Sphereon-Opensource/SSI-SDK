import { Loggers } from '@sphereon/ssi-types'
import fetch from 'cross-fetch'
import { imageSize } from 'image-size'
import { IImageDimensions, IImageResource } from '../types'
import * as u8a from 'uint8arrays'

const logger = Loggers.DEFAULT.get('sphereon:core')
type SizeCalculationResult = {
  width?: number
  height?: number
  orientation?: number
  type?: string
}

// TODO: here we're handling svg separately, remove this section when image-size starts supporting it in version 2
const isSvg = (uint8Array: Uint8Array): boolean => {
  const maxCheckLength: number = Math.min(80, uint8Array.length)
  const initialText: string = u8a.toString(uint8Array.subarray(0, maxCheckLength))
  const normalizedText: string = initialText.trim().toLowerCase()
  return normalizedText.startsWith('<svg') || normalizedText.startsWith('<?xml')
}

const parseDimension = (dimension: string): number => {
  const match: RegExpMatchArray | null = dimension.match(/^(\d+(?:\.\d+)?)([a-z%]*)$/)
  return match ? parseFloat(match[1]) : 0
}

const getSvgDimensions = (uint8Array: Uint8Array): SizeCalculationResult => {
  const svgContent: string = new TextDecoder().decode(uint8Array)
  const widthMatch: RegExpMatchArray | null = svgContent.match(/width="([^"]+)"/)
  const heightMatch: RegExpMatchArray | null = svgContent.match(/height="([^"]+)"/)
  const viewBoxMatch: RegExpMatchArray | null = svgContent.match(/viewBox="[^"]*"/)

  let width: number | undefined = widthMatch ? parseDimension(widthMatch[1]) : undefined
  let height: number | undefined = heightMatch ? parseDimension(heightMatch[1]) : undefined

  if (viewBoxMatch && (!width || !height)) {
    const parts = viewBoxMatch[0].match(/[\d\.]+/g)?.map(Number)
    if (parts && parts.length === 4) {
      const [x, y, viewBoxWidth, viewBoxHeight] = parts
      width = width ?? viewBoxWidth - x
      height = height ?? viewBoxHeight - y
    }
  }

  return { width, height, type: 'svg' }
}

/**
 *
 * @param value can be both (base64) string and Uint8Array
 */
export const getImageMediaType = async (value: string | Uint8Array): Promise<string | undefined> => {
  const uint8Array = typeof value === 'string' ? u8a.fromString(value, 'base64') : value
  if (isSvg(uint8Array)) {
    return `image/svg+xml`
  }
  const result: SizeCalculationResult = imageSize(uint8Array)
  return `image/${result.type}`
}

/**
 *
 * @param value can be both (base64) string and Uint8Array
 */
export const getImageDimensions = async (value: string | Uint8Array): Promise<IImageDimensions> => {
  const uint8Array = typeof value === 'string' ? u8a.fromString(value, 'base64') : value
  const dimensions: SizeCalculationResult = isSvg(uint8Array) ? getSvgDimensions(uint8Array) : imageSize(uint8Array)

  if (!dimensions.width || !dimensions.height) {
    return Promise.reject(Error('Unable to get image dimensions'))
  }

  return { width: dimensions.width, height: dimensions.height }
}

export const downloadImage = async (url: string): Promise<IImageResource | undefined> => {
  logger.debug(`Downloading image from url: ${url}`)
  if (!url) {
    logger.warning(`Could not download image when nu url is provided`)
    return
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    logger.warning(`Could not download image when url does not start with http(s):// : ${url}`)
    return
  }
  try {
    const response: Response = await fetch(url)
    if (!response.ok) {
      logger.error(`Could not download image ${url}. Status: ${response.status} ${response.statusText}`)
    }

    const contentType: string | null = response.headers.get('Content-Type')
    const base64Content: string = Buffer.from(await response.arrayBuffer()).toString('base64')

    return {
      base64Content,
      contentType: contentType || undefined,
    }
  } catch (e) {
    logger.error(`Could not download image ${url}`, e)
    return undefined
  }
}
