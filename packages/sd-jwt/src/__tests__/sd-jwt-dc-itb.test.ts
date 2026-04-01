import { describe, expect, it } from 'vitest'
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc'
import { defaultGenerateDigest } from '../defaultCallbacks'
import { verifyRawSignature } from '@sphereon/ssi-sdk-ext.key-utils'
import { fromString } from 'uint8arrays/from-string'

/**
 * Real dc+sd-jwt credential issued by ITB testbed (itb.ilabs.ai/diipv5).
 * Format: dc+sd-jwt, alg: ES256, issuer: did:web:itb.ilabs.ai:diipv5
 */
const ITB_SD_JWT =
  'eyJ0eXAiOiJkYytzZC1qd3QiLCJraWQiOiJkaWQ6d2ViOml0Yi5pbGFicy5haTpkaWlwdjUja2V5cy0xIiwiYWxnIjoiRVMyNTYifQ' +
  '.eyJpc3MiOiJkaWQ6d2ViOml0Yi5pbGFicy5haTpkaWlwdjUiLCJpYXQiOjE3NzUwNzA3NTcsIm5iZiI6MTc3NTA3MDc1NywiZXhwIjoxNzkwODgxOTU3LCJ2Y3QiOiJ1cm46ZXUuZXVyb3BhLmVjLmV1ZGk6cGlkOjEiLCJjbmYiOnsia2lkIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmlJc0luVnpaU0k2SW5OcFp5SXNJbXQwZVNJNklrVkRJaXdpWTNKMklqb2lVQzB5TlRZaUxDSjRJam9pVlUxTFRESnBjWEp4WDJkVGFEWktjVk56U1VweE16WnVOM296YkhaV1RFbGFWVkF4ZG5KR1NVUkNSU0lzSW5raU9pSnZhM05UWTBKb2RVZzNUa1pQWVVOWk4zQnNhalY1TUVSQ1RUbDNSbTlwVEUxYU56QkdYM1ZrZEVWTkluMCMwIn0sIl9zZCI6WyItRlVUaFk0QklQdE5hbHdqTUJGOXpvMmlqYTRERENLMEpvVDJ3YzI0cjIwIiwiMTNXVVYwNkNHQ3pGeXZsYTdWaTRyeThPS1FHTnRIa01xNXNVYnByMFotayIsIjR2cHBuOUtfYThrWDVLV1hSTl9KbnNHYTk1bVFLdjFkTUlYc3RsTkNvdE0iLCJBWmRGQVZ2Slc5Rnl5SnBhWGdNV24tWFNzUjlMcjN2VzRvc1NQdUdfMlNRIiwiV01jMmRsTG5hd2tkaldkbUlXS0xFcE9UejMwcnZtaHFyNzJTRXZSaDlMNCIsImJzd3BkVDAtdGszMHJlS1NxNWdTVkpYVUdDSFNxSG1DcnUyclR4U0Vma0kiLCJsbm50eWh3S0RfUEhqTUxUTVE0dWRvbVNqUkUzNXRvWS1jaGFCSmZmNkVvIiwicVpEOUhubHZ6bjJpb2xWeUpLNV94cklBeGJ2WmdrbFpYVmlwRTdjSHdrTSJdLCJfc2RfYWxnIjoic2hhLTI1NiJ9' +
  '.35LiLqFYIL0EtS_rsQAVFwV8R3OxX-jZuOZeEwV5IjtZtEenqaA2uU6TrdGJ2jEqiiHULLjnK6VA35SeHbKejg' +
  '~WyI1NjQ5Yzg2NDZjZjJmNmVlIiwiZ2l2ZW5fbmFtZSIsIkhhbm5hIl0~' +
  'WyIwODdjZTk1OTYzZTM0ZDUxIiwiZmFtaWx5X25hbWUiLCJNYXRrYWxhaW5lbiJd~' +
  'WyJhNWJlMmU4OGEyNjkzOGY2IiwiYmlydGhfZGF0ZSIsIjAxLjA3LjIwMDUiXQ~' +
  'WyJjMzEwY2VlOTZlMjZkYzdkIiwiYWdlX292ZXJfMTgiLHRydWVd~' +
  'WyJjYzA2MTI1YjE5OTYwMjEyIiwiaXNzdWFuY2VfZGF0ZSIsMTc3NTA3MDc1NzUzMl0~' +
  'WyJhMDM3OTE0NTFkYmYyMTA4IiwiZXhwaXJ5X2RhdGUiLDE4MDY2MDY3NTc1MzJd~' +
  'WyJjNzhmNjFhNzUwOWZkMjc1IiwiaXNzdWluZ19hdXRob3JpdHkiLCJVQWVnZWFuIFRlc3QgSXNzdWVyIl0~' +
  'WyJjZTNiODIwOTM5NmFiODBmIiwiaXNzdWluZ19jb3VudHJ5IiwiRmlubGFuZCJd~'

/**
 * Public key from did:web:itb.ilabs.ai:diipv5 DID document
 * Fetched from https://itb.ilabs.ai/diipv5/did.json
 */
const ITB_ISSUER_PUBLIC_KEY = {
  kty: 'EC',
  x: 'ijVgOGHvwHSeV1Z2iLF9pQLQAw7KcHF3VIjThhvVtBQ',
  y: 'SfFShWAUGEnNx24V2b5G1jrhJNHmMwtgROBOi9OKJLc',
  crv: 'P-256',
}

function base64urlToBytes(s: string): Uint8Array {
  // Convert base64url to base64
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

describe('ITB testbed dc+sd-jwt credential (itb.ilabs.ai/diipv5)', () => {
  it('should decode the SD-JWT and extract correct claims', async () => {
    const sdjwt = new SDJwtVcInstance({ hasher: defaultGenerateDigest })
    const decoded = await sdjwt.decode(ITB_SD_JWT)

    expect(decoded.jwt).toBeDefined()
    expect(decoded.jwt?.header?.typ).toBe('dc+sd-jwt')
    expect(decoded.jwt?.header?.alg).toBe('ES256')
    expect(decoded.jwt?.header?.kid).toBe('did:web:itb.ilabs.ai:diipv5#keys-1')
    expect(decoded.jwt?.payload?.iss).toBe('did:web:itb.ilabs.ai:diipv5')
    expect(decoded.jwt?.payload?.vct).toBe('urn:eu.europa.ec.eudi:pid:1')
    expect(decoded.disclosures).toHaveLength(8)
  })

  it('should extract disclosed claims via getClaims', async () => {
    const sdjwt = new SDJwtVcInstance({ hasher: defaultGenerateDigest })
    const decoded = await sdjwt.decode(ITB_SD_JWT)
    const claims = await decoded.getClaims(defaultGenerateDigest)

    expect(claims).toMatchObject({
      iss: 'did:web:itb.ilabs.ai:diipv5',
      vct: 'urn:eu.europa.ec.eudi:pid:1',
      given_name: 'Hanna',
      family_name: 'Matkalainen',
      birth_date: '01.07.2005',
      age_over_18: true,
      issuance_date: 1775070757532,
      expiry_date: 1806606757532,
      issuing_authority: 'UAegean Test Issuer',
      issuing_country: 'Finland',
    })
  })

  it('should verify raw ES256 signature against the DID document public key', async () => {
    const parts = ITB_SD_JWT.split('~')[0].split('.')
    const headerPayload = `${parts[0]}.${parts[1]}`
    const signatureB64url = parts[2]

    const data = fromString(headerPayload, 'utf-8')
    const signature = base64urlToBytes(signatureB64url)

    const valid = await verifyRawSignature({
      data,
      signature,
      key: ITB_ISSUER_PUBLIC_KEY,
      opts: { signatureAlg: 'ES256' },
    })

    // This FAILS — the testbed signs with a key that does not match its DID document.
    // The public key in did:web:itb.ilabs.ai:diipv5 (and its JWKS) does not correspond
    // to the private key used to sign this credential.
    expect(valid).toBe(false)
  })

  it('should fail sd-jwt verification due to signature mismatch', async () => {
    let verifierCalled = false
    const verifier = async (data: string, signature: string): Promise<boolean> => {
      verifierCalled = true
      const dataBytes = fromString(data, 'utf-8')
      const sigBytes = base64urlToBytes(signature)
      return verifyRawSignature({
        data: dataBytes,
        signature: sigBytes,
        key: ITB_ISSUER_PUBLIC_KEY,
        opts: { signatureAlg: 'ES256' },
      })
    }

    const sdjwt = new SDJwtVcInstance({
      hasher: defaultGenerateDigest,
      verifier,
    })

    await expect(sdjwt.verify(ITB_SD_JWT)).rejects.toThrow('Invalid JWT Signature')
    expect(verifierCalled).toBe(true)
  })
})
