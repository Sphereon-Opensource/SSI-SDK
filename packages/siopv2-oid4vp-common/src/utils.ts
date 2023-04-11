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
  let baseUri = `${!!opts?.baseURI ? opts.baseURI : opts?.envVarName ? process.env[opts.envVarName!] : process.env.BACKEND_BASE_URL}`
  if (!baseUri || baseUri === 'undefined') {
    throw Error('No base URI provided as param or environment variable')
  } else if (!baseUri.startsWith('http')) {
    throw Error(`Base URI needs to start with http(s). Received: ${baseUri}`)
  }
  baseUri = baseUri.endsWith('/') ? baseUri.substring(0, baseUri.length - 1) : baseUri
  return `${baseUri}${path.startsWith('/') ? path : '/' + path}`
}
