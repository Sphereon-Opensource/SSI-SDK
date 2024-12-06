import { AsyncHasher, SdJwtTypeMetadata } from '@sphereon/ssi-types'
import * as u8a from 'uint8arrays'

// Helper function to fetch API with error handling
export async function fetchUrlWithErrorHandling(url: string): Promise<Response> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`)
  }
  return response
}

export async function validateIntegrity(input: any, integrityValue: string, hasher: AsyncHasher, alg?: string): Promise<boolean> {
  const hash = await hasher(input, alg ?? 'sha256')
  return u8a.toString(hash, 'utf-8') === integrityValue
}

export function assertValidTypeMetadata(metadata: SdJwtTypeMetadata, vct: string): void {
  if (metadata.vct !== vct) {
    throw new Error('VCT mismatch in metadata and credential')
  }
}
