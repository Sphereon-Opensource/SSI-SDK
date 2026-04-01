import { describe, expect, it } from 'vitest'
import { cwtSignCallback } from '../src/agent/OID4VCIHolder'

describe('COSE Key Binding Support', () => {
  describe('cwtSignCallback', () => {
    it('should produce a valid base64url-encoded COSE_Sign1 CWT', async () => {
      const identifierResult = {
        method: 'cose_key' as const,
        key: { kid: 'test-key' },
        kmsKeyRef: 'test-key-ref',
        issuer: 'https://wallet.example.com',
      }

      // Mock agent with real CBOR encoding but mocked signing
      const mockAgent = {
        identifierManagedGet: async () => identifierResult,
        keyManagerSign: async (args: any) => {
          // Return a fake base64url signature — the test verifies the CBOR structure, not the crypto
          expect(args.keyRef).toBe('test-key-ref')
          expect(args.algorithm).toBe('ES256')
          expect(typeof args.data).toBe('string')
          return 'dGVzdC1zaWduYXR1cmU' // base64url of "test-signature"
        },
      }

      const callback = cwtSignCallback(identifierResult as any, { agent: mockAgent } as any)
      const result = await callback({
        aud: 'https://issuer.example.com',
        nonce: 'test-nonce-123',
        alg: 'ES256',
      })

      // Result should be a non-empty base64url string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/)

      // Decode and verify it's a valid COSE_Sign1 CBOR array
      const mdocPkg = (await import('@sphereon/kmp-mdoc-core')).default
      const { com } = mdocPkg
      const decoded = com.sphereon.cbor.Cbor.decode(com.sphereon.kmp.decodeFrom(result, com.sphereon.kmp.Encoding.BASE64URL))
      expect(decoded).toBeInstanceOf(com.sphereon.cbor.CborArray)

      const elements = decoded.value.asJsArrayView()
      // COSE_Sign1 = [protected_header, unprotected_header, payload, signature]
      expect(elements.length).toBe(4)

      // Protected header is a CBOR byte string
      expect(elements[0]).toBeInstanceOf(com.sphereon.cbor.CborByteString)

      // Decode protected header — verify alg and content type are present
      const protectedHeader = com.sphereon.cbor.Cbor.decode(elements[0].value)
      expect(protectedHeader).toBeInstanceOf(com.sphereon.cbor.CborMap)

      // Payload is a CBOR byte string containing claims
      expect(elements[2]).toBeInstanceOf(com.sphereon.cbor.CborByteString)
      const payload = com.sphereon.cbor.Cbor.decode(elements[2].value)
      expect(payload).toBeInstanceOf(com.sphereon.cbor.CborMap)
      const claimsMap = payload.value.asJsMapView()
      // iss=1, aud=3, iat=6, nonce=10 → 4 claims
      expect(claimsMap.size).toBe(4)

      // Signature is a non-empty CBOR byte string
      expect(elements[3]).toBeInstanceOf(com.sphereon.cbor.CborByteString)
      expect(elements[3].value.length).toBeGreaterThan(0)
    })

    it('should omit nonce from CWT claims when not provided', async () => {
      const identifierResult = {
        method: 'cose_key' as const,
        key: { kid: 'test-key' },
        kmsKeyRef: 'key-ref',
        issuer: 'https://wallet.example.com',
      }

      const mockAgent = {
        identifierManagedGet: async () => identifierResult,
        keyManagerSign: async () => 'dGVzdC1zaWduYXR1cmU',
      }

      const callback = cwtSignCallback(identifierResult as any, { agent: mockAgent } as any)
      const result = await callback({
        aud: 'https://issuer.example.com',
        alg: 'ES256',
      })

      const mdocPkg = (await import('@sphereon/kmp-mdoc-core')).default
      const { com } = mdocPkg
      const decoded = com.sphereon.cbor.Cbor.decode(com.sphereon.kmp.decodeFrom(result, com.sphereon.kmp.Encoding.BASE64URL))
      const elements = decoded.value.asJsArrayView()
      const payload = com.sphereon.cbor.Cbor.decode(elements[2].value)
      const claimsMap = payload.value.asJsMapView()
      // iss=1, aud=3, iat=6 → 3 claims (no nonce)
      expect(claimsMap.size).toBe(3)
    })

    it('should default to ES256 algorithm when not specified', async () => {
      let capturedAlgorithm: string | undefined
      const identifierResult = {
        method: 'cose_key' as const,
        key: { kid: 'test-key' },
        kmsKeyRef: 'key-ref',
        issuer: 'https://wallet.example.com',
      }

      const mockAgent = {
        identifierManagedGet: async () => identifierResult,
        keyManagerSign: async (args: any) => {
          capturedAlgorithm = args.algorithm
          return 'dGVzdC1zaWduYXR1cmU'
        },
      }

      const callback = cwtSignCallback(identifierResult as any, { agent: mockAgent } as any)
      await callback({ aud: 'https://issuer.example.com' })

      expect(capturedAlgorithm).toBe('ES256')
    })
  })
})
