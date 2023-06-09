import fetch from 'cross-fetch'
import sizeOf from 'image-size'
import { ISizeCalculationResult } from 'image-size/dist/types/interface'
import { IImageDimensions, IImageResource } from '../types'

export const getImageMediaType = async (base64: string): Promise<string | undefined> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  const result: ISizeCalculationResult = sizeOf(buffer)

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
  const dimensions: ISizeCalculationResult = sizeOf(buffer)

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
