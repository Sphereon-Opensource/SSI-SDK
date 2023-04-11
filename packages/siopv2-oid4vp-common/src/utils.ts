import * as u8a from 'uint8arrays'
import * as process from 'process'

export function base64ToBytes(s: string): Uint8Array {
  const inputBase64Url = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return u8a.fromString(inputBase64Url, 'base64url')
}

export function decodeBase64url(s: string): string {
  return u8a.toString(base64ToBytes(s))
}

export function uriWithBase(path: string, opts?: { baseURI?: string; envVarName?: string }) {
  let baseUri = `${opts?.baseURI ?? opts?.envVarName ? process.env[opts.envVarName!] : process.env.BACKEND_BASE_URL}`
  baseUri = baseUri.endsWith('/') ? baseUri.substring(0, baseUri.length - 1) : baseUri
  return `${baseUri}${path.startsWith('/') ? path : '/' + path}`
}
