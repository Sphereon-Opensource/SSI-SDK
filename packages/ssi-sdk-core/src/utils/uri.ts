// TODO add tests

export const getDataTypeFromDataURI = async (uri: string): Promise<string> => {
  const startIndex: number = uri.indexOf(':') + 1
  const endIndex: number = uri.indexOf(';')
  if (startIndex === -1 || endIndex === -1) {
    return Promise.reject(Error('No data type found'))
  }

  return uri.substring(startIndex, endIndex)
}

export const getDataTypeFromURL = async (url: string): Promise<string> => {
  const pathname: string = new URL(url).pathname
  const lastSlashIndex: number = pathname.lastIndexOf('/')
  const filename: string = pathname.substring(lastSlashIndex + 1)
  const dotIndex: number = filename.lastIndexOf('.')

  if (dotIndex === -1 || dotIndex === filename.length - 1) {
    return Promise.reject(Error('No file extension found'))
  }

  return filename.substring(dotIndex + 1)
}

export const extractBase64FromDataURI = async (dataURI: string): Promise<string> => {
  const regex: RegExp = /^data:[^;]+;base64,([\w+/=-]+)$/i
  const matches: RegExpMatchArray | null = dataURI.match(regex)

  if (!matches || matches.length <= 1) {
    return Promise.reject(Error('invalid base64 uri'))
  }

  return matches[1]
}
