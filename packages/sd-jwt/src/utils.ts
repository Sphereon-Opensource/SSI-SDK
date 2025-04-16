import { SdJwtTypeMetadata } from '@sphereon/ssi-types'
// @ts-ignore
import { toString } from 'uint8arrays/to-string'
import { Hasher, HasherSync } from '@sd-jwt/types'

// Helper function to fetch API with error handling
export async function fetchUrlWithErrorHandling(url: string): Promise<Response> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`)
  }
  return response
}

export type IntegrityAlg = 'sha256' | 'sha384' | 'sha512'

function extractHashAlgFromIntegrity(integrityValue?: string): IntegrityAlg | undefined {
  const val = integrityValue?.toLowerCase().trim().split('-')[0]
  if (val === 'sha256' || val === 'sha384' || val === 'sha512') {
    return val as IntegrityAlg
  }
  return undefined
}

export function extractHashFromIntegrity(integrityValue?: string): string | undefined {
  return integrityValue?.toLowerCase().trim().split('-')[1]
}

export async function validateIntegrity({
  input,
  integrityValue,
  hasher,
}: {
  input: any
  integrityValue?: string
  hasher: HasherSync | Hasher
}): Promise<boolean> {
  if (!integrityValue) {
    return true
  }
  const alg = extractHashAlgFromIntegrity(integrityValue)
  if (!alg) {
    return false
  }
  const calculatedHash = await createIntegrity({ hasher, input, alg })
  return calculatedHash == integrityValue
}

export async function createIntegrity({
  input,
  hasher,
  alg = 'sha256',
}: {
  input: any
  hasher: HasherSync | Hasher
  alg?: IntegrityAlg
}): Promise<string> {
  const calculatedHash = await hasher(typeof input === 'string' ? input : JSON.stringify(input), alg)
  return `${alg}-${toString(calculatedHash, 'base64')}`
}

export function assertValidTypeMetadata(metadata: SdJwtTypeMetadata, vct: string): void {
  if (metadata.vct !== vct) {
    throw new Error('VCT mismatch in metadata and credential')
  }
}
