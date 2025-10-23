import { TAgent } from '@veramo/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { IKmsRestClient } from '../../src'

type ConfiguredAgent = TAgent<IKmsRestClient>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('ssi-sdk.kms-rest-client', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async (): Promise<void> => {
      await testContext.tearDown()
    })

    it('should list resolvers', async () => {
      const result = await agent.kmsListResolvers({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.resolvers.length).toBeGreaterThan(0)
    })

    it('should get resolver by id', async (): Promise<void> => {
      const result = await agent.kmsGetResolver({
        baseUrl: 'https://ssi-backend.sphereon.com',
        resolverId: 'jose_cose_resolver',
      })

      expect(result.resolverId).toBeDefined()
      expect(result.supportedIdentifierMethods).toBeDefined()
      expect(result.supportedKeyTypes).toBeDefined()
    })

    it('should resolve key', async (): Promise<void> => {
      const result = await agent.kmsResolveKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        resolverId: 'jose_cose_resolver',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'DwRiRyvtMXhFwCKuoAMnpviMmrE1B0Fu44_LeQEycEs',
            y: '3BnhvdB6QYGp7x9Ey7qW_TNZ0MI0hNZgLlyl6rbxln8',
            d: 'xVjyhcZDnLR3zJcuMMlQjXlNGDz3hxS0_aCoDd8P9XY',
          },
          alias: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
          providerId: 'test-software',
          kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PRIVATE',
          keyType: 'EC',
          keyEncoding: 'JOSE',
        },
      })

      expect(result.key).toBeDefined()
      expect(result.kid).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.keyType).toBeDefined()
      expect(result.keyEncoding).toBeDefined()
    })

    it('should create raw signature', async (): Promise<void> => {
      const result = await agent.kmsCreateRawSignature({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '7KYAtmhlRu4M5k5Uv9-jV3XKgRc8wpzJYKg3l89LkGQ',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        input: 'aGVsbG8=',
      })

      expect(result.signature).toBeDefined()
    })

    it('should verify raw signature', async (): Promise<void> => {
      const result = await agent.kmsIsValidRawSignature({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '7KYAtmhlRu4M5k5Uv9-jV3XKgRc8wpzJYKg3l89LkGQ',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        input: 'aGVsbG8=',
        signature: 'RrTEoBb/3KQSEiCYnrTizM4O7qWeY5cNQYlQYl4pLMZKyLBYaoU1uxzmwLMFAIfnwA41mMTyLZlG4JG0zCm9iA==',
      })

      expect(result.isValid).toBeTruthy()
    })

    it('should get key by alias or kid', async (): Promise<void> => {
      const storeResult = await agent.kmsStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(storeResult.alias).toBeDefined()

      const result = await agent.kmsGetKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        aliasOrKid: storeResult.alias,
      })

      expect(result.key).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.kid).toBeDefined()
      expect(result.signatureAlgorithm).toBeDefined() // TODO this seems to be null?
      expect(result.keyVisibility).toBeDefined() // TODO this seems to be null?
      expect(result.keyType).toBeDefined()
      expect(result.keyEncoding).toBeDefined()
    })

    it('should list keys', async (): Promise<void> => {
      const storeResult = await agent.kmsStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(storeResult.alias).toBeDefined()

      const result = await agent.kmsListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should list keys with provider id', async (): Promise<void> => {
      const storeResult = await agent.kmsStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(storeResult.alias).toBeDefined()

      const result = await agent.kmsListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should store key', async (): Promise<void> => {
      const result = await agent.kmsStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(result.key).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.kid).toBeDefined()
      expect(result.x5c).toBeDefined()
      expect(result.keyType).toBeDefined()
      expect(result.keyEncoding).toBeDefined()
      expect(result.opts).toBeDefined()
    })

    it('should generate key', async (): Promise<void> => {
      const result = await agent.kmsGenerateKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        use: 'sig',
        alg: 'ECDSA_SHA256',
        keyOperations: ['sign'],
      })

      expect(result.providerId).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.cose).toBeDefined()
      expect(result.jose).toBeDefined()
      expect(result.kid).toBeDefined()
    })

    it('should delete key', async (): Promise<void> => {
      const storeResult = await agent.kmsStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(storeResult.alias).toBeDefined()

      const result = await agent.kmsDeleteKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        aliasOrKid: storeResult.alias,
      })

      expect(result).toBeTruthy()
    })

    it('should get provider by id', async (): Promise<void> => {
      const result = await agent.kmsGetKeyProvider({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.providerId).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should list providers', async () => {
      const result = await agent.kmsListKeyProviders({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.providers.length).toBeGreaterThan(0)
    })

    it('should list provider keys', async () => {
      const generateResult = await agent.kmsProviderStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(generateResult.alias).toBeDefined()

      const result = await agent.kmsProviderListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should store provider key', async (): Promise<void> => {
      const result = await agent.kmsProviderStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(result.key).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.kid).toBeDefined()
      expect(result.x5c).toBeDefined()
      expect(result.keyType).toBeDefined()
      expect(result.keyEncoding).toBeDefined()
      expect(result.opts).toBeDefined()
    })

    it('should generate provider key', async (): Promise<void> => {
      const result = await agent.kmsProviderGenerateKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        use: 'sig',
        alg: 'ECDSA_SHA256',
        keyOperations: ['sign'],
      })

      expect(result.providerId).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.cose).toBeDefined()
      expect(result.jose).toBeDefined()
      expect(result.kid).toBeDefined()
    })

    it('should get provider key by alias or kid', async (): Promise<void> => {
      const generateResult = await agent.kmsProviderStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(generateResult.alias).toBeDefined()

      const result = await agent.kmsProviderGetKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        aliasOrKid: generateResult.alias,
      })

      expect(result.key).toBeDefined()
      expect(result.alias).toBeDefined()
      expect(result.providerId).toBeDefined()
      expect(result.kid).toBeDefined()
      expect(result.signatureAlgorithm).toBeDefined()
      expect(result.keyVisibility).toBeDefined()
      expect(result.keyType).toBeDefined()
      expect(result.keyEncoding).toBeDefined()
    })

    it('should delete provider key', async (): Promise<void> => {
      const generateResult = await agent.kmsProviderStoreKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        keyInfo: {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            keyOps: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
          keyType: 'EC',
        },
        certChain: [
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
          'MIIByTCCAW6gAwIBAgIQF+SpO+EPJj42boA4WHPL2zAKBggqhkjOPQQDAjBAMT4wPAYDVQQDEzVBY2MgS2l3YSBEaWdpdGFsIENlcnRpZmljYXRpb24gV2FsbGV0IEludGVybWVkaWF0ZSBDQTAeFw0yNTA2MjUxMzA4MzJaFw0yNjA2MjUxMzA4MzJaMDYxNDAyBgNVBAMTK3dhbGxldC02NDA2MzA3OS02ZmM3LTRhZTgtOWEwMi0yNTE4YTRhYmQyZmIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASnaLC4eYSs/8XkDz8rDANemjmyI+N5g0yIJIiScgCnjZogmlDGGQ8HYCdvs9SJJJ3c17YSax44vVl6LMnidvKno1QwUjAJBgNVHRMEAjAAMB0GA1UdDgQWBBRI7w4/H9JCty7T4aVl+im74XEV0zAOBgNVHQ8BAf8EBAMCB4AwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSQAwRgIhAPnLEppg5TGMCqp/Nn+2os6vupEclyKv1yk/JQFQME8TAiEAiYrVm/6J8zGmhtiG958kZB0afXhM/i3DuY8+0kpTUzA=',
        ],
      })

      expect(generateResult.alias).toBeDefined()

      const result = await agent.kmsProviderDeleteKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        aliasOrKid: generateResult.alias,
      })

      expect(result).toBeTruthy()
    })
  })
}
