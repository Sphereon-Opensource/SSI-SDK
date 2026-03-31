import { describe, expect, it } from 'vitest'
import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  CredentialResponse,
  OpenId4VCIVersion,
} from '@sphereon/oid4vci-common'
import { extractCredentialFromResponse } from '../src/services/OID4VCIHolderService'

describe('OID4VCI v1.0 final - Holder/Client', () => {
  describe('Version enum', () => {
    it('should have VER_1_0 with value 1100', () => {
      expect(OpenId4VCIVersion.VER_1_0).toBe(1100)
    })

    it('should have VER_1_0_15 with value 1015', () => {
      expect(OpenId4VCIVersion.VER_1_0_15).toBe(1015)
    })

    it('should order VER_1_0 higher than VER_1_0_15', () => {
      expect(OpenId4VCIVersion.VER_1_0).toBeGreaterThan(OpenId4VCIVersion.VER_1_0_15)
    })
  })

  describe('OpenID4VCIClient (version-agnostic)', () => {
    it('should have fromURI factory method', () => {
      expect(typeof OpenID4VCIClient.fromURI).toBe('function')
    })

    it('should have fromCredentialIssuer factory method', () => {
      expect(typeof OpenID4VCIClient.fromCredentialIssuer).toBe('function')
    })

    it('should have fromState factory method', () => {
      expect(typeof OpenID4VCIClient.fromState).toBe('function')
    })
  })

  describe('extractCredentialFromResponse', () => {
    it('should extract credential from V1.0 singular response format', () => {
      const response: CredentialResponse = {
        credential: 'eyJhbGciOiJFUzI1NiJ9.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwifQ.signature',
        c_nonce: 'new-nonce',
        c_nonce_expires_in: 300,
        notification_id: 'notif-123',
      }

      const credential = extractCredentialFromResponse(response)
      expect(credential).toBe('eyJhbGciOiJFUzI1NiJ9.eyJ2Y3QiOiJJZGVudGl0eUNyZWRlbnRpYWwifQ.signature')
    })

    it('should extract credential from draft 15 array response format', () => {
      const response: CredentialResponse = {
        credentials: [{ credential: 'eyJhbGciOiJFUzI1NiJ9.draft15-credential.sig' }],
        notification_id: 'notif-456',
      }

      const credential = extractCredentialFromResponse(response)
      expect(credential).toBe('eyJhbGciOiJFUzI1NiJ9.draft15-credential.sig')
    })

    it('should use singular credential when both fields are present', () => {
      // In practice a response will have one or the other, not both.
      // But if both are present, the singular `credential` check comes first.
      const response: CredentialResponse = {
        credential: 'v1-credential',
        credentials: [{ credential: 'd15-credential' }],
      }

      const credential = extractCredentialFromResponse(response)
      expect(credential).toBe('v1-credential')
    })

    it('should throw when no credential is present (deferred response)', () => {
      const response: CredentialResponse = {
        transaction_id: 'tx-123',
        acceptance_token: 'accept-token',
      }

      expect(() => extractCredentialFromResponse(response)).toThrow('No credential found')
    })

    it('should handle V1.0 credential response with c_nonce', () => {
      const response: CredentialResponse = {
        credential: 'sd-jwt-credential~disclosure1~disclosure2~kb-jwt',
        c_nonce: 'fresh-nonce',
        c_nonce_expires_in: 600,
      }

      expect(response.c_nonce).toBe('fresh-nonce')
      expect(response.c_nonce_expires_in).toBe(600)
      const credential = extractCredentialFromResponse(response)
      expect(credential).toBe('sd-jwt-credential~disclosure1~disclosure2~kb-jwt')
    })
  })

  describe('Credential response format handling', () => {
    it('should support V1.0 deferred issuance fields', () => {
      const response: CredentialResponse = {
        transaction_id: 'deferred-tx-id',
        acceptance_token: 'acceptance-token-v1',
        interval: 5,
      }

      expect(response.transaction_id).toBe('deferred-tx-id')
      expect(response.acceptance_token).toBe('acceptance-token-v1')
      expect(response.interval).toBe(5)
    })

    it('should support notification_id in both versions', () => {
      const v1Response: CredentialResponse = {
        credential: 'v1-cred',
        notification_id: 'notif-v1',
      }

      const d15Response: CredentialResponse = {
        credentials: [{ credential: 'd15-cred' }],
        notification_id: 'notif-d15',
      }

      expect(v1Response.notification_id).toBe('notif-v1')
      expect(d15Response.notification_id).toBe('notif-d15')
    })
  })
})
