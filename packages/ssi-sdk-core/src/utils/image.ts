import fetch from 'cross-fetch'
import sizeOf from 'image-size'
import { ISizeCalculationResult } from 'image-size/dist/types/interface'
import { getDataTypeFromDataURI, getDataTypeFromURL } from './uri'
import { IImageDimensions } from '../types'

// TODO add tests

export const getImageType = async (uri: string): Promise<string> => {
  // TODO we can improve these regexes
  // TODO dont check for image types, make it more lose, check if it a data uri and just get the type
  const IS_IMAGE_URI_REGEX: RegExp = /^data:image\/(png|jpg|jpeg|bmp|gif|webp);base64,/
  // TODO we should just check if it is a url based on http/https
  const IS_IMAGE_URL_REGEX: RegExp = /\.(jpg|jpeg|png|gif|bmp|webp)$/i

  if (IS_IMAGE_URI_REGEX.test(uri)) {
    return getDataTypeFromDataURI(uri)
  } else if (IS_IMAGE_URL_REGEX.test(uri)) {
    return getDataTypeFromURL(uri)
  }

  return Promise.reject(Error('Invalid image uri'))
}

export const getImageDimensions = async (base64: string): Promise<IImageDimensions> => {
  const buffer: Buffer = Buffer.from(base64, 'base64')
  const dimensions: ISizeCalculationResult = sizeOf(buffer)

  if (!dimensions.width || !dimensions.height) {
    return Promise.reject(Error('Unable to get image dimensions'))
  }

  return { width: dimensions.width, height: dimensions.height }
}

export const downloadImage = async (url: string): Promise<Buffer> => {
  const response: Response = await fetch(url)
  if (!response.ok) {
    return Promise.reject(Error(`Failed to download image. Status: ${response.status} ${response.statusText}`))
  }
  const imageData: ArrayBuffer = await response.arrayBuffer()

  return Buffer.from(imageData)
}
