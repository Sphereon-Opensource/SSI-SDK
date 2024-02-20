import { TKeyType } from '@veramo/core'
import { concat as concatArrays, fromString, toString } from 'uint8arrays'
import varint from './varint/varint'

export enum MultibaseFormat {
  BASE58 = 'z',
}

export function hexToMultibase(hex: string, type: TKeyType): { value: string; format: MultibaseFormat; keyType: TKeyType } {
  return { value: bytesToMultibase(hexToBytes(hex), type), format: MultibaseFormat.BASE58, keyType: type }
}

export function multibaseToHex(multibase: string): { value: string; keyType: TKeyType; format: MultibaseFormat } {
  if (!multibase.startsWith(MultibaseFormat.BASE58)) {
    throw new Error('Only base58 supported for now using multibase!')
  }

  const props = multibaseKeyToProps(multibase)
  return { value: bytesToHex(multibaseKeyToBytes(multibase)), keyType: props.keyType, format: MultibaseFormat.BASE58 }
}

const u8a = { toString, fromString, concatArrays }

/**
 * Converts a Uint8Array to a base64url string
 * @param b - the array to be converted
 *
 * @public
 */
export function bytesToBase64url(b: Uint8Array): string {
  return u8a.toString(b, 'base64url')
}

/**
 * Converts a base64url string to the Uint8Array it represents.
 *
 * @param s - the string to be converted
 *
 * @throws if the string is not formatted correctly.
 *
 * @public
 */
export function base64ToBytes(s: string): Uint8Array {
  const inputBase64Url = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return u8a.fromString(inputBase64Url, 'base64url')
}
/**
 * Encodes a Uint8Array to a base64 string representation with padding.
 * @param b - the byte array to convert
 *
 * @public
 */
export function bytesToBase64(b: Uint8Array): string {
  return u8a.toString(b, 'base64pad')
}

/**
 * Encodes the bytes of an input string to base64url
 * @param s - the original string
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function encodeBase64url(s: string): string {
  return bytesToBase64url(u8a.fromString(s))
}

/**
 * Decodes a base64url string to a utf8 string represented by the same bytes.
 * @param s - the base64url string to be decoded
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function decodeBase64url(s: string): string {
  return u8a.toString(base64ToBytes(s))
}

/**
 * Builds a string from a Uint8Array using the utf-8 encoding.
 * @param b - the array to be converted
 *
 * @public
 */
export function bytesToUtf8String(b: Uint8Array): string {
  return u8a.toString(b, 'utf-8')
}

/**
 * Encodes a string to a Uint8Array using the utf-8 encoding.
 * @param s - the string to be encoded
 *
 * @public
 */
export function stringToUtf8Bytes(s: string): Uint8Array {
  return u8a.fromString(s, 'utf-8')
}

/**
 * Stringifies a JSON object and encodes the bytes of the resulting string to a base64url representation.
 * @param payload - the object to be encoded
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function encodeJoseBlob(payload: {}) {
  return u8a.toString(u8a.fromString(JSON.stringify(payload), 'utf-8'), 'base64url')
}

/**
 * Decodes a base64url string representing stringified JSON to a JSON object.
 *
 * @param blob - The base64url encoded stringified JSON to be decoded
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function decodeJoseBlob(blob: string) {
  return JSON.parse(u8a.toString(u8a.fromString(blob, 'base64url'), 'utf-8'))
}

/**
 * Converts a hex string (with or without prefix) to a byte array (Uint8Array)
 *
 * @param hexString - The string representing the encoding
 * @returns the `Uint8Array` represented by the given string
 *
 * @throws `illegal_argument` error if the parameter is not a string
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function hexToBytes(hexString: string): Uint8Array {
  // @ts-ignore
  if (hexString instanceof Uint8Array) {
    return Uint8Array.from(hexString)
  }
  if (typeof hexString !== 'string') {
    throw new Error('illegal_argument: a string must be provided for a hex-string to byte array conversion')
  }
  const noPrefix = hexString.startsWith('0x') ? hexString.substring(2) : hexString
  const padded = noPrefix.length % 2 !== 0 ? `0${noPrefix}` : noPrefix
  return u8a.fromString(padded.toLowerCase(), 'base16')
}

/**
 * Converts a Uint8Array input to a hex string
 *
 * @param byteArray - The array to be converted
 * @param prefix - If this is set to true, the resulting hex string will be prefixed with 0x
 *
 * @returns the hex encoding of the input byte array
 *
 * @throws `illegal_argument` error if the input is not a Uint8Array
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function bytesToHex(byteArray: Uint8Array, prefix: boolean = false): string {
  if (!(byteArray instanceof Uint8Array)) {
    throw new Error('illegal_argument: only byte arrays can be converted to hex encoding')
  }
  const result = u8a.toString(byteArray, 'base16')
  return prefix ? `0x${result}` : result
}

/**
 * Converts a base58 string to the Uint8Array it represents.
 *
 * @param s - the string to be converted
 *
 * @throws if the string is not formatted correctly.
 *
 * @public
 */
export function base58ToBytes(s: string): Uint8Array {
  return u8a.fromString(s, 'base58btc')
}

/**
 * Converts a base58 string to the Uint8Array it represents.
 *
 * @param s - the string to be converted
 *
 * @throws if the string is not formatted correctly.
 *
 * @public
 */
export function bytesToBase58(byteArray: Uint8Array): string {
  return u8a.toString(byteArray, 'base58btc')
}

/**
 * Converts a multibase string to the Uint8Array it represents.
 *
 * @param s - the string to be converted
 *
 * @throws if the string is not formatted correctly.
 *
 * @public
 */
export function multibaseKeyToBytes(s: string): Uint8Array {
  if (s.charAt(0) !== 'z') {
    throw new Error('invalid multibase string: string is not base58 encoded (does not start with "z")')
  }
  const bytes = u8a.fromString(s.substring(1), 'base58btc')
  const props = multibaseKeyToProps(s)
  const keyLength = props.code.length / 2

  if (props.keyType === 'RSA') {
    if (bytes[2] !== 48) {
      throw Error('Invalid RSA octet sequence')
    }
    return bytes.slice(2)
  } else if (props.keyType === 'Secp256r1') {
    return bytes.slice(2)
  }
  if (bytes[keyLength] !== 0x01) {
    throw Error(`Invalid multicodec value at position ${keyLength}:   ${bytes[keyLength]}`)
  }
  return bytes.slice(keyLength + 1)
}

export function multibaseKeyToProps(s: string): MultiCodedLookup {
  if (s.charAt(0) !== 'z') {
    throw new Error('invalid multibase string: string is not base58 encoded (does not start with "z")')
  }

  const bytes = u8a.fromString(s.substring(1), 'base58btc')
  const code = varint.decode(bytes)
  return getMultibasePropsByCode(code)
}

export interface MultiCodedLookup {
  code: string
  keyType: TKeyType
  minLegth: number
  maxLength: number
}

export const SUPPORTED_KEY_CODECS: MultiCodedLookup[] = [
  { code: 'e7', keyType: 'Secp256k1', minLegth: 33, maxLength: 33 },
  { code: 'ec', keyType: 'X25519', minLegth: 32, maxLength: 32 },
  { code: 'ed', keyType: 'Ed25519', minLegth: 32, maxLength: 32 },
  { code: '1200', keyType: 'Secp256r1', minLegth: 33, maxLength: 34 },
  // {code: "1201", keyType: 'Secp384r1', minLegth: 49, maxLength: 49}, //TODO: Implement keytype
  // {code: "1202", keyType: 'Secp521r1', minLegth: 65, maxLength: 65}, //TODO: Implement keytype
  { code: '1205', keyType: 'RSA', minLegth: 10, maxLength: 512 }, // TODO: Lookup what we should put here
]

export function getMultibasePropsByType(keytype: TKeyType) {
  const props = SUPPORTED_KEY_CODECS.find((row) => row.keyType === keytype)
  if (!props) {
    throw Error(`Multibase not supported (yet) for key type: ${keytype}`)
  }
  return props
}

export function getMultibasePropsByCode(code: string | number) {
  const props = SUPPORTED_KEY_CODECS.find((row) => (typeof code === 'string' ? row.code === code : row.code === code.toString(16)))
  if (!props) {
    throw Error(`Multibase not supported (yet) for code: ${code}`)
  }
  return props
}

/**
 * Converts a Uint8Array to a multibase string.
 *
 * @param b - the array to be converted
 * @param type - the type of the key to be represented
 *
 * @throws if the array is not formatted correctly.
 *
 * @public
 */
export function bytesToMultibase(byteArray: Uint8Array, type: TKeyType): string {
  const props = getMultibasePropsByType(type)
  if (byteArray.length < props.minLegth || byteArray.length > props.maxLength) {
    throw Error(`Length of provided bytes (${byteArray.length}) falls outside of the bounds ${props.minLegth} and ${props.maxLength}`)
  }
  const multicodec = '01'
  const varCode = Number.parseInt(props.code, 16)
  const length = props.code.length / 2
  const varType = new Uint8Array(length)
  varint.encode(varCode, varType)
  const bytes = u8a.concatArrays([
    varType,
    props.keyType === 'RSA' || props.keyType === 'Secp256r1' ? new Uint8Array(0) : u8a.fromString(multicodec, 'base16'),
    byteArray,
  ])
  return 'z' + u8a.toString(bytes, 'base58btc')
}

/**
 * Concatenates a bunch of arrays into one Uint8Array
 * @param arrays - the arrays to be concatenated
 * @param length - the maximum length of the resulting array
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function concat(arrays: ArrayLike<number>[], length?: number): Uint8Array {
  return u8a.concatArrays(arrays, length)
}
