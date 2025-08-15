import { JsonWebKey, JWK } from '@sphereon/ssi-types'
// @ts-ignore
import type { ByteView } from 'multiformats/codecs/interface'
// @ts-ignore
import { TextDecoder, TextEncoder } from 'web-encoding'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * Checks if the value is a non-empty string.
 *
 * @param value - The value to check.
 * @param description - Description of the value to check.
 * @param optional
 */
function check(value: unknown, description: string, optional: boolean = false) {
  if (optional && !value) {
    return
  }
  if (typeof value !== 'string' || !value) {
    throw new Error(`${description} missing or invalid`)
  }
}

/**
 * Checks if the value is a valid JSON object.
 *
 * @param value - The value to check.
 */
function assertObject(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new Error('Value must be an object')
  }
}

/**
 * Checks if the JWK is valid. It must contain all the required members.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518#section-6
 * @see https://www.rfc-editor.org/rfc/rfc8037#section-2
 *
 * @param jwk - The JWK to check.
 * @param opts
 */
export function validateJwk(jwk: any, opts?: { crvOptional?: boolean }) {
  assertObject(jwk)
  const { crvOptional = false } = opts ?? {}
  check(jwk.kty, '"kty" (Key Type) Parameter', false)

  // Check JWK required members based on the key type
  switch (jwk.kty) {
    /**
     * @see https://www.rfc-editor.org/rfc/rfc7518#section-6.2.1
     */
    case 'EC':
      check(jwk.crv, '"crv" (Curve) Parameter', crvOptional)
      check(jwk.x, '"x" (X Coordinate) Parameter')
      check(jwk.y, '"y" (Y Coordinate) Parameter')
      break
    /**
     * @see https://www.rfc-editor.org/rfc/rfc8037#section-2
     */
    case 'OKP':
      check(jwk.crv, '"crv" (Subtype of Key Pair) Parameter', crvOptional) // Shouldn't this one always be true as crv is not always present?
      check(jwk.x, '"x" (Public Key) Parameter')
      break
    /**
     * @see https://www.rfc-editor.org/rfc/rfc7518#section-6.3.1
     */
    case 'RSA':
      check(jwk.e, '"e" (Exponent) Parameter')
      check(jwk.n, '"n" (Modulus) Parameter')
      break
    default:
      throw new Error('"kty" (Key Type) Parameter missing or unsupported')
  }
}

/**
 * Extracts the required members of the JWK and canonicalizes it.
 *
 * @param jwk - The JWK to canonicalize.
 * @returns The JWK with only the required members, ordered lexicographically.
 */
export function minimalJwk(jwk: any): JWK {
  // "default" case is not needed
  // eslint-disable-next-line default-case
  switch (jwk.kty) {
    case 'EC':
      return { ...(jwk.crv && { crv: jwk.crv }), kty: jwk.kty, x: jwk.x, y: jwk.y }
    case 'OKP':
      return { ...(jwk.crv && { crv: jwk.crv }), kty: jwk.kty, x: jwk.x }
    case 'RSA':
      return { e: jwk.e, kty: jwk.kty, n: jwk.n }
  }
  throw Error(`Unsupported key type (kty) provided: ${jwk.kty}`)
}

/**
 * Encodes a JWK into a Uint8Array. Only the required JWK members are encoded.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518#section-6
 * @see https://www.rfc-editor.org/rfc/rfc8037#section-2
 * @see https://github.com/panva/jose/blob/3b8aa47b92d07a711bf5c3125276cc9a011794a4/src/jwk/thumbprint.ts#L37
 *
 * @param jwk - JSON Web Key.
 * @returns Uint8Array-encoded JWK.
 */
export function jwkJcsEncode(jwk: unknown): Uint8Array {
  validateJwk(jwk)
  const strippedJwk = minimalJwk(jwk)
  return textEncoder.encode(jcsCanonicalize(strippedJwk))
}

/**
 * Decodes an array of bytes into a JWK. Throws an error if the JWK is not valid.
 *
 * @param bytes - The array of bytes to decode.
 * @returns The corresponding JSON Web Key.
 */
export function jwkJcsDecode(bytes: ByteView<JsonWebKey>): JsonWebKey {
  const jwk = JSON.parse(textDecoder.decode(bytes))
  validateJwk(jwk)
  if (JSON.stringify(jwk) !== jcsCanonicalize(minimalJwk(jwk))) {
    throw new Error('The JWK embedded in the DID is not correctly formatted')
  }
  return jwk
}

// From: https://github.com/cyberphone/json-canonicalization
export function jcsCanonicalize(object: any) {
  let buffer = ''
  serialize(object)
  return buffer

  function serialize(object: any) {
    if (object === null || typeof object !== 'object' || object.toJSON != null) {
      /////////////////////////////////////////////////
      // Primitive type or toJSON - Use ES6/JSON     //
      /////////////////////////////////////////////////
      buffer += JSON.stringify(object)
    } else if (Array.isArray(object)) {
      /////////////////////////////////////////////////
      // Array - Maintain element order              //
      /////////////////////////////////////////////////
      buffer += '['
      let next = false
      object.forEach((element) => {
        if (next) {
          buffer += ','
        }
        next = true
        /////////////////////////////////////////
        // Array element - Recursive expansion //
        /////////////////////////////////////////
        serialize(element)
      })
      buffer += ']'
    } else {
      /////////////////////////////////////////////////
      // Object - Sort properties before serializing //
      /////////////////////////////////////////////////
      buffer += '{'
      let next = false
      Object.keys(object)
        .sort()
        .forEach((property) => {
          if (next) {
            buffer += ','
          }
          next = true
          ///////////////////////////////////////////////
          // Property names are strings - Use ES6/JSON //
          ///////////////////////////////////////////////
          buffer += JSON.stringify(property)
          buffer += ':'
          //////////////////////////////////////////
          // Property value - Recursive expansion //
          //////////////////////////////////////////
          serialize(object[property])
        })
      buffer += '}'
    }
  }
}
