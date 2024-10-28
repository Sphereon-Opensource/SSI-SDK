export const replaceNullWithUndefined = (obj: any): any => {
  if (obj === null) {
    return undefined
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((value: any) => replaceNullWithUndefined(value))
  }

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = replaceNullWithUndefined(obj[key])
    }
  }
  return result
}
