export class ObjectUtils {
  public static asArray(value: unknown) {
    return Array.isArray(value) ? value : [value]
  }

  public static isObject(value: unknown) {
    return Object.prototype.toString.call(value) === '[object Object]'
  }

  public static isUrlAbsolute(url: string) {
    // regex to check for absolute IRI (starting scheme and ':') or blank node IRI
    const isAbsoluteRegex = /^([A-Za-z][A-Za-z0-9+-.]*|_):[^\s]*$/
    ObjectUtils.isString(url) && isAbsoluteRegex.test(url)
  }

  public static isString(value: unknown): boolean {
    return typeof value === 'string' || Object.prototype.toString.call(value) === '[object String]'
  }
}
