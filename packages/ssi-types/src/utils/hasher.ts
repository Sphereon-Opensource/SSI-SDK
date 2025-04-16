import { sha256, sha384, sha512 } from '@noble/hashes/sha2'

// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString } = u8a
import type { HasherSync } from '../types'

const supportedAlgorithms = ['sha256', 'sha384', 'sha512'] as const
type SupportedAlgorithms = (typeof supportedAlgorithms)[number]

export const shaHasher: HasherSync = (data, algorithm) => {
  const sanitizedAlgorithm = algorithm.toLowerCase().replace(/[-_]/g, '')
  if (!supportedAlgorithms.includes(sanitizedAlgorithm as SupportedAlgorithms)) {
    throw new Error(`Unsupported hashing algorithm ${algorithm}`)
  }
  const hasher = sanitizedAlgorithm === 'sha384' ? sha384 : sanitizedAlgorithm === 'sha512' ? sha512 : sha256
  return hasher(typeof data === 'string' ? fromString(data) : new Uint8Array(data))
}

export const defaultHasher: HasherSync = shaHasher
