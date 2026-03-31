import { describe, expect, it } from 'vitest'
import {
  DCAPIProtocolIdentifier,
  ResponseMode,
  SupportedVersion,
  type RelyingPartyAttestation,
} from '@sphereon/did-auth-siop'
import type { IRPOptions } from '../src/types/ISIOPv2RP'
import { getRequestVersion } from '../src/functions'

describe('OID4VP v1.0 final - RP (Verifier)', () => {
  describe('Response modes', () => {
    it('should have dc_api response mode available', () => {
      expect(ResponseMode.DC_API).toBe('dc_api')
    })

    it('should have dc_api.jwt response mode available', () => {
      expect(ResponseMode.DC_API_JWT).toBe('dc_api.jwt')
    })

    it('should have all expected response modes', () => {
      expect(ResponseMode.FRAGMENT).toBe('fragment')
      expect(ResponseMode.DIRECT_POST).toBe('direct_post')
      expect(ResponseMode.DIRECT_POST_JWT).toBe('direct_post.jwt')
      expect(ResponseMode.DC_API).toBe('dc_api')
      expect(ResponseMode.DC_API_JWT).toBe('dc_api.jwt')
      expect(ResponseMode.QUERY).toBe('query')
      expect(ResponseMode.QUERY_JWT).toBe('query.jwt')
      expect(ResponseMode.FRAGMENT_JWT).toBe('fragment.jwt')
    })
  })

  describe('DC API protocol identifiers', () => {
    it('should expose all DC API protocol identifiers', () => {
      expect(DCAPIProtocolIdentifier.UNSIGNED).toBe('openid4vp-v1-unsigned')
      expect(DCAPIProtocolIdentifier.SIGNED).toBe('openid4vp-v1-signed')
      expect(DCAPIProtocolIdentifier.MULTISIGNED).toBe('openid4vp-v1-multisigned')
    })
  })

  describe('Version handling', () => {
    it('should default to V1 when no supported versions specified', () => {
      const opts: Partial<IRPOptions> = {}
      const version = getRequestVersion(opts as IRPOptions)
      expect(version).toBe(SupportedVersion.OID4VP_v1)
    })

    it('should use first version from supportedVersions array', () => {
      const opts: Partial<IRPOptions> = {
        supportedVersions: [SupportedVersion.SIOPv2_OID4VP_D28, SupportedVersion.OID4VP_v1],
      }
      const version = getRequestVersion(opts as IRPOptions)
      expect(version).toBe(SupportedVersion.SIOPv2_OID4VP_D28)
    })

    it('should support V1 as default first version', () => {
      const opts: Partial<IRPOptions> = {
        supportedVersions: [SupportedVersion.OID4VP_v1, SupportedVersion.SIOPv2_OID4VP_D28],
      }
      const version = getRequestVersion(opts as IRPOptions)
      expect(version).toBe(SupportedVersion.OID4VP_v1)
    })
  })

  describe('IRPOptions V1 fields', () => {
    it('should accept transactionData in IRPOptions', () => {
      const opts: Partial<IRPOptions> = {
        transactionData: ['base64url-encoded-tx-data'],
        supportedVersions: [SupportedVersion.OID4VP_v1],
      }
      expect(opts.transactionData).toBeDefined()
      expect(opts.transactionData).toHaveLength(1)
    })

    it('should accept verifierInfo in IRPOptions for V1', () => {
      const attestation: RelyingPartyAttestation = {
        format: 'jwt',
        data: 'eyJhbGciOiJFUzI1NiJ9.test.sig',
      }
      const opts: Partial<IRPOptions> = {
        verifierInfo: [attestation],
        supportedVersions: [SupportedVersion.OID4VP_v1],
      }
      expect(opts.verifierInfo).toHaveLength(1)
      expect(opts.verifierInfo![0].format).toBe('jwt')
    })

    it('should accept verifierAttestations in IRPOptions for D28', () => {
      const attestation: RelyingPartyAttestation = {
        format: 'jwt',
        data: 'eyJhbGciOiJFUzI1NiJ9.test.sig',
        credential_ids: ['my_credential'],
      }
      const opts: Partial<IRPOptions> = {
        verifierAttestations: [attestation],
        supportedVersions: [SupportedVersion.SIOPv2_OID4VP_D28],
      }
      expect(opts.verifierAttestations).toHaveLength(1)
      expect(opts.verifierAttestations![0].credential_ids).toEqual(['my_credential'])
    })

    it('should accept expectedOrigins for DC API', () => {
      const opts: Partial<IRPOptions> = {
        expectedOrigins: ['https://verifier.example.com'],
        responseMode: ResponseMode.DC_API,
        supportedVersions: [SupportedVersion.OID4VP_v1],
      }
      expect(opts.expectedOrigins).toEqual(['https://verifier.example.com'])
    })

    it('should accept walletNonce and requestUriMethod for POST flow', () => {
      const opts: Partial<IRPOptions> = {
        walletNonce: 'wallet-nonce-value',
        requestUriMethod: 'post',
        supportedVersions: [SupportedVersion.OID4VP_v1],
      }
      expect(opts.walletNonce).toBe('wallet-nonce-value')
      expect(opts.requestUriMethod).toBe('post')
    })
  })

  describe('Version enum values', () => {
    it('should have correct numeric values', () => {
      expect(SupportedVersion.OID4VP_v1).toBe(1000)
      expect(SupportedVersion.SIOPv2_OID4VP_D28).toBe(280)
    })

    it('should order V1 as higher priority than D28', () => {
      expect(SupportedVersion.OID4VP_v1).toBeGreaterThan(SupportedVersion.SIOPv2_OID4VP_D28)
    })
  })
})
