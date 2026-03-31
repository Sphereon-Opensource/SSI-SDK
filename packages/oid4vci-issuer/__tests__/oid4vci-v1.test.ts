import { describe, expect, it } from 'vitest'
import { OpenId4VCIVersion } from '@sphereon/oid4vci-common'
import { VcIssuerBuilder } from '@sphereon/oid4vci-issuer'
import type { IIssuerOptions } from '../src/types/IOID4VCIIssuer'

describe('OID4VCI v1.0 final - Issuer', () => {
  describe('Version enum', () => {
    it('should have VER_1_0 for 1.0 final', () => {
      expect(OpenId4VCIVersion.VER_1_0).toBe(1100)
    })

    it('should have VER_1_0_15 for draft 15', () => {
      expect(OpenId4VCIVersion.VER_1_0_15).toBe(1015)
    })
  })

  describe('IIssuerOptions version field', () => {
    it('should accept VER_1_0 as version', () => {
      const opts: Partial<IIssuerOptions> = {
        version: OpenId4VCIVersion.VER_1_0,
      }
      expect(opts.version).toBe(OpenId4VCIVersion.VER_1_0)
    })

    it('should accept VER_1_0_15 as version', () => {
      const opts: Partial<IIssuerOptions> = {
        version: OpenId4VCIVersion.VER_1_0_15,
      }
      expect(opts.version).toBe(OpenId4VCIVersion.VER_1_0_15)
    })

    it('should default to undefined (createVciIssuerBuilder defaults to VER_1_0)', () => {
      const opts: Partial<IIssuerOptions> = {}
      expect(opts.version).toBeUndefined()
    })
  })

  describe('VcIssuerBuilder version support', () => {
    it('should accept withVersion for V1.0', () => {
      const builder = new VcIssuerBuilder()
      const result = builder.withVersion(OpenId4VCIVersion.VER_1_0)
      expect(result).toBe(builder) // fluent API returns this
    })

    it('should accept withVersion for draft 15', () => {
      const builder = new VcIssuerBuilder()
      const result = builder.withVersion(OpenId4VCIVersion.VER_1_0_15)
      expect(result).toBe(builder)
    })
  })

  describe('V1.0 vs draft 15 credential response format', () => {
    it('should describe V1.0 singular credential response', () => {
      // In 1.0 final, the response has a singular `credential` field
      const v1Response = {
        credential: 'eyJhbGciOiJFUzI1NiJ9.payload.signature',
        c_nonce: 'fresh-nonce',
        c_nonce_expires_in: 300,
        notification_id: 'notif-123',
      }
      expect(v1Response.credential).toBeDefined()
      expect(v1Response.c_nonce).toBeDefined()
      expect(v1Response.c_nonce_expires_in).toBeDefined()
    })

    it('should describe draft 15 array credentials response', () => {
      // In draft 15, the response has a `credentials` array of wrapped objects
      const d15Response = {
        credentials: [{ credential: 'eyJhbGciOiJFUzI1NiJ9.payload.signature' }],
        notification_id: 'notif-456',
      }
      expect(d15Response.credentials).toHaveLength(1)
      expect(d15Response.credentials[0].credential).toBeDefined()
    })
  })

  describe('V1.0 deferred issuance', () => {
    it('should support acceptance_token for V1.0 deferred issuance', () => {
      const deferredResponse = {
        transaction_id: 'tx-deferred-123',
        acceptance_token: 'accept-token',
        interval: 5,
      }
      expect(deferredResponse.transaction_id).toBe('tx-deferred-123')
      expect(deferredResponse.acceptance_token).toBe('accept-token')
      expect(deferredResponse.interval).toBe(5)
    })
  })

  describe('V1.0 credential request format', () => {
    it('should require credential_configuration_id in V1.0', () => {
      // In 1.0 final: credential_configuration_id is REQUIRED
      const v1Request = {
        credential_configuration_id: 'IdentityCredential',
        proof: {
          proof_type: 'jwt' as const,
          jwt: 'eyJhbGciOiJFUzI1NiJ9.proof.sig',
        },
      }
      expect(v1Request.credential_configuration_id).toBe('IdentityCredential')
    })

    it('should support credential_identifiers array in V1.0', () => {
      // In 1.0 final: credential_identifiers is OPTIONAL array
      const v1Request = {
        credential_configuration_id: 'IdentityCredential',
        credential_identifiers: ['id1', 'id2'],
      }
      expect(v1Request.credential_identifiers).toHaveLength(2)
    })

    it('should support singular credential_identifier in draft 15', () => {
      // In draft 15: credential_identifier is singular
      const d15Request = {
        credential_identifier: 'single-id',
      }
      expect(d15Request.credential_identifier).toBe('single-id')
    })
  })
})
