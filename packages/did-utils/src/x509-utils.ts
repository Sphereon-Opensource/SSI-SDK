import * as u8a from 'uint8arrays'
// @ts-ignore
import keyto from '@trust/keyto'
import { JWK, KeyVisibility } from './types'

// Based on (MIT licensed):
// https://github.com/hildjj/node-posh/blob/master/lib/index.js
export function pemCertChainTox5c(cert: string, maxDepth?: number): string[] {
  if (!maxDepth) {
    maxDepth = 0
  }
  /*
   * Convert a PEM-encoded certificate to the version used in the x5c element
   * of a [JSON Web Key](http://tools.ietf.org/html/draft-ietf-jose-json-web-key).
   *
   * `cert` PEM-encoded certificate chain
   * `maxdepth` The maximum number of certificates to use from the chain.
   */

  const intermediate = cert
    .replace(/-----[^\n]+\n?/gm, ',')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
  let x5c = intermediate.split(',').filter(function (c) {
    return c.length > 0
  })
  if (maxDepth > 0) {
    x5c = x5c.splice(0, maxDepth)
  }
  return x5c
}

export function x5cToPemCertChain(x5c: string[], maxDepth?: number): string {
  if (!maxDepth) {
    maxDepth = 0
  }
  const length = maxDepth === 0 ? x5c.length : Math.min(maxDepth, x5c.length)
  let pem = ''
  for (let i = 0; i < length; i++) {
    pem += base64ToPEM(x5c[i], 'CERTIFICATE')
  }
  return pem
}

export const toKeyObject = (PEM: string, visibility: KeyVisibility = 'public') => {
  const jwk = PEMToJwk(PEM, visibility)
  const keyVisibility: KeyVisibility = jwk.d ? 'private' : 'public'
  const keyHex = keyVisibility === 'private' ? privateKeyHexFromPEM(PEM) : publicKeyHexFromPEM(PEM)

  return {
    pem: hexToPEM(keyHex, visibility),
    jwk,
    keyHex,
    keyType: keyVisibility,
  }
}

export const jwkToPEM = (jwk: JWK, visibility: KeyVisibility = 'public'): string => {
  return keyto.from(jwk, 'jwk').toString('pem', visibility === 'public' ? 'public_pkcs8' : 'private_pkcs8')
}

export const PEMToJwk = (pem: string, visibility: KeyVisibility = 'public'): JWK => {
  return keyto.from(pem, 'pem').toJwk(visibility)
}
export const privateKeyHexFromPEM = (PEM: string) => {
  return PEMToHex(PEM)
}

export const hexKeyFromPEMBasedJwk = (jwk: JWK, visibility: KeyVisibility = 'public'): string => {
  if (visibility === 'private') {
    return privateKeyHexFromPEM(jwkToPEM(jwk, 'private'))
  } else {
    return publicKeyHexFromPEM(jwkToPEM(jwk, 'public'))
  }
}

export const publicKeyHexFromPEM = (PEM: string) => {
  const hex = PEMToHex(PEM)
  if (PEM.includes('CERTIFICATE')) {
    throw Error('Cannot directly deduce public Key from PEM Certificate yet')
  } else if (!PEM.includes('PRIVATE')) {
    return hex
  }
  const publicJwk = PEMToJwk(PEM, 'public')
  const publicPEM = jwkToPEM(publicJwk, 'public')
  return PEMToHex(publicPEM)
}

export const PEMToHex = (PEM: string, headerKey?: string): string => {
  if (PEM.indexOf('-----BEGIN ') == -1) {
    throw Error(`PEM header not found: ${headerKey}`)
  }

  let strippedPem: string
  if (headerKey) {
    strippedPem = PEM.replace(new RegExp('^[^]*-----BEGIN ' + headerKey + '-----'), '')
    strippedPem = strippedPem.replace(new RegExp('-----END ' + headerKey + '-----[^]*$'), '')
  } else {
    strippedPem = PEM.replace(/^[^]*-----BEGIN [^-]+-----/, '')
    strippedPem = strippedPem.replace(/-----END [^-]+-----[^]*$/, '')
  }
  return base64ToHex(strippedPem, 'base64pad')
}

/**
 * Converts a base64 encoded string to hex string, removing any non-base64 characters, including newlines
 * @param input The input in base64, with optional newlines
 * @param inputEncoding
 */
export const base64ToHex = (input: string, inputEncoding?: 'base64pad' | 'base64urlpad') => {
  const base64NoNewlines = input.replace(/[^0-9A-Za-z\/+=]*/g, '')
  return u8a.toString(u8a.fromString(base64NoNewlines, inputEncoding ? inputEncoding : 'base64pad'), 'base16')
}

const hexToBase64 = (input: number | object | string, targetEncoding?: 'base64pad' | 'base64urlpad'): string => {
  let hex = typeof input === 'string' ? input : input.toString(16)
  if (hex.length % 2 === 1) {
    hex = `0${hex}`
  }
  return u8a.toString(u8a.fromString(hex, 'base16'), targetEncoding ? targetEncoding : 'base64pad')
}

export const hexToPEM = (hex: string, type: KeyVisibility): string => {
  const base64 = hexToBase64(hex, 'base64pad')
  const headerKey = type === 'private' ? 'RSA PRIVATE KEY' : 'PUBLIC KEY'
  if (type === 'private') {
    const pem = base64ToPEM(base64, headerKey)
    try {
      PEMToJwk(pem) // We only use it to test the private key
      return pem
    } catch (error) {
      return base64ToPEM(base64, 'PRIVATE KEY')
    }
  }
  return base64ToPEM(base64, headerKey)
}

export function base64ToPEM(cert: string, headerKey?: 'PUBLIC KEY' | 'RSA PRIVATE KEY' | 'PRIVATE KEY' | 'CERTIFICATE'): string {
  const key = headerKey ?? 'CERTIFICATE'
  const matches = cert.match(/.{1,64}/g)
  if (!matches) {
    throw Error('Invalid cert input value supplied')
  }
  return `-----BEGIN ${key}-----\n${matches.join('\n')}\n-----END ${key}-----\n`
}
