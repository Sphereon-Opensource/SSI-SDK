import { describe, expect, it } from 'vitest'
import { DCAPIProtocolIdentifier, ResponseMode, SupportedVersion } from '@sphereon/did-auth-siop'

describe('OID4VP v1.0 final - OP (Holder/Wallet)', () => {
  describe('DC API protocol identifiers', () => {
    it('should expose unsigned protocol identifier', () => {
      expect(DCAPIProtocolIdentifier.UNSIGNED).toBe('openid4vp-v1-unsigned')
    })

    it('should expose signed protocol identifier', () => {
      expect(DCAPIProtocolIdentifier.SIGNED).toBe('openid4vp-v1-signed')
    })

    it('should expose multisigned protocol identifier', () => {
      expect(DCAPIProtocolIdentifier.MULTISIGNED).toBe('openid4vp-v1-multisigned')
    })
  })

  describe('DC API response modes', () => {
    it('should recognize dc_api as a valid response mode', () => {
      expect(ResponseMode.DC_API).toBe('dc_api')
    })

    it('should recognize dc_api.jwt as a valid response mode', () => {
      expect(ResponseMode.DC_API_JWT).toBe('dc_api.jwt')
    })

    it('should support all OID4VP response modes', () => {
      expect(ResponseMode.FRAGMENT).toBe('fragment')
      expect(ResponseMode.DIRECT_POST).toBe('direct_post')
      expect(ResponseMode.DIRECT_POST_JWT).toBe('direct_post.jwt')
      expect(ResponseMode.DC_API).toBe('dc_api')
      expect(ResponseMode.DC_API_JWT).toBe('dc_api.jwt')
    })
  })

  describe('Version enum values', () => {
    it('should have OID4VP_v1 with value 1000', () => {
      expect(SupportedVersion.OID4VP_v1).toBe(1000)
    })

    it('should have SIOPv2_OID4VP_D28 with value 280', () => {
      expect(SupportedVersion.SIOPv2_OID4VP_D28).toBe(280)
    })

    it('should order V1 as higher priority than D28', () => {
      expect(SupportedVersion.OID4VP_v1).toBeGreaterThan(SupportedVersion.SIOPv2_OID4VP_D28)
    })
  })

  describe('Default supported versions', () => {
    it('should support both V1 and D28 by default', () => {
      const defaultVersions = [SupportedVersion.OID4VP_v1, SupportedVersion.SIOPv2_OID4VP_D28]
      expect(defaultVersions).toContain(SupportedVersion.OID4VP_v1)
      expect(defaultVersions).toContain(SupportedVersion.SIOPv2_OID4VP_D28)
      // V1 should be first (highest priority)
      expect(defaultVersions[0]).toBe(SupportedVersion.OID4VP_v1)
    })
  })

  describe('Credential format support', () => {
    it('should support dc+sd-jwt format (SD-JWT VC)', () => {
      const dcqlQuery = {
        credentials: [
          {
            id: 'sd_jwt_credential',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['https://example.com/identity'] },
            claims: [{ path: ['given_name'] }, { path: ['family_name'] }],
          },
        ],
      }
      expect(dcqlQuery.credentials[0].format).toBe('dc+sd-jwt')
    })

    it('should support vc+sd-jwt format (VCDM2 SD-JWT)', () => {
      // vc+sd-jwt is repurposed for VCDM2 SD-JWT (NOT deprecated)
      const dcqlQuery = {
        credentials: [
          {
            id: 'vcdm2_credential',
            format: 'vc+sd-jwt',
            claims: [{ path: ['name'] }],
          },
        ],
      }
      expect(dcqlQuery.credentials[0].format).toBe('vc+sd-jwt')
    })

    it('should support mso_mdoc format', () => {
      const dcqlQuery = {
        credentials: [
          {
            id: 'mdl_credential',
            format: 'mso_mdoc',
            meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
            claims: [{ path: ['org.iso.18013.5.1', 'given_name'] }],
          },
        ],
      }
      expect(dcqlQuery.credentials[0].format).toBe('mso_mdoc')
    })
  })
})
