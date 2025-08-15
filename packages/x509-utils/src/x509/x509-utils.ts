import { X509Certificate } from '@peculiar/x509'
import { Certificate } from 'pkijs'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a
// @ts-ignore
import keyto from '@trust/keyto'
import type { KeyVisibility } from '../types'

import type { JsonWebKey } from '@sphereon/ssi-types'
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
    pem += derToPEM(x5c[i], 'CERTIFICATE')
  }
  return pem
}

export const pemOrDerToX509Certificate = (cert: string | Uint8Array | X509Certificate): Certificate => {
  let DER: string | undefined = typeof cert === 'string' ? cert : undefined
  if (typeof cert === 'object' && !(cert instanceof Uint8Array)) {
    // X509Certificate object
    return Certificate.fromBER(cert.rawData)
  } else if (typeof cert !== 'string') {
    return Certificate.fromBER(cert)
  } else if (cert.includes('CERTIFICATE')) {
    DER = PEMToDer(cert)
  }
  if (!DER) {
    throw Error('Invalid cert input value supplied. PEM, DER, Bytes and X509Certificate object are supported')
  }
  return Certificate.fromBER(fromString(DER, 'base64pad'))
}

export const areCertificatesEqual = (cert1: Certificate, cert2: Certificate): boolean => {
  return cert1.signatureValue.isEqual(cert2.signatureValue)
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

export const jwkToPEM = (jwk: JsonWebKey, visibility: KeyVisibility = 'public'): string => {
  return keyto.from(jwk, 'jwk').toString('pem', visibility === 'public' ? 'public_pkcs8' : 'private_pkcs8')
}

export const PEMToJwk = (pem: string, visibility: KeyVisibility = 'public'): JsonWebKey => {
  return keyto.from(pem, 'pem').toJwk(visibility)
}
export const privateKeyHexFromPEM = (PEM: string) => {
  return PEMToHex(PEM)
}

export const hexKeyFromPEMBasedJwk = (jwk: JsonWebKey, visibility: KeyVisibility = 'public'): string => {
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

export function PEMToBinary(pem: string): Uint8Array {
  const pemContents = pem
    .replace(/^[^]*-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----[^]*$/, '')
    .replace(/\s/g, '')

  return fromString(pemContents, 'base64pad')
}

/**
 * Converts a base64 encoded string to hex string, removing any non-base64 characters, including newlines
 * @param input The input in base64, with optional newlines
 * @param inputEncoding
 */
export const base64ToHex = (input: string, inputEncoding?: 'base64' | 'base64pad' | 'base64url' | 'base64urlpad') => {
  const base64NoNewlines = input.replace(/[^0-9A-Za-z_\-~\/+=]*/g, '')
  return toString(fromString(base64NoNewlines, inputEncoding ? inputEncoding : 'base64pad'), 'base16')
}

export const hexToBase64 = (input: number | object | string, targetEncoding?: 'base64' | 'base64pad' | 'base64url' | 'base64urlpad'): string => {
  let hex = typeof input === 'string' ? input : input.toString(16)
  if (hex.length % 2 === 1) {
    hex = `0${hex}`
  }
  return toString(fromString(hex, 'base16'), targetEncoding ? targetEncoding : 'base64pad')
}

export const hexToPEM = (hex: string, type: KeyVisibility): string => {
  const base64 = hexToBase64(hex, 'base64pad')
  const headerKey = type === 'private' ? 'RSA PRIVATE KEY' : 'PUBLIC KEY'
  if (type === 'private') {
    const pem = derToPEM(base64, headerKey)
    try {
      PEMToJwk(pem) // We only use it to test the private key
      return pem
    } catch (error) {
      return derToPEM(base64, 'PRIVATE KEY')
    }
  }
  return derToPEM(base64, headerKey)
}

export function PEMToDer(pem: string): string {
  return pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '')
}

export function derToPEM(cert: string, headerKey?: 'PUBLIC KEY' | 'RSA PRIVATE KEY' | 'PRIVATE KEY' | 'CERTIFICATE'): string {
  const key = headerKey ?? 'CERTIFICATE'
  if (cert.includes(key)) {
    // Was already in PEM it seems
    return cert
  }
  const matches = cert.match(/.{1,64}/g)
  if (!matches) {
    throw Error('Invalid cert input value supplied')
  }
  return `-----BEGIN ${key}-----\n${matches.join('\n')}\n-----END ${key}-----\n`
}
