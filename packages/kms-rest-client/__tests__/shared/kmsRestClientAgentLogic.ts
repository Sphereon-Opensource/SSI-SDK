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
      const result = await agent.kmsClientListResolvers({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.resolvers.length).toBeGreaterThan(0)
    })

    it('should get resolver by id', async (): Promise<void> => {
      const result = await agent.kmsClientGetResolver({
        baseUrl: 'https://ssi-backend.sphereon.com',
        resolverId: 'jose_cose_resolver',
      })

      expect(result.resolverId).toBeDefined()
      expect(result.supportedIdentifierMethods).toBeDefined()
      expect(result.supportedKeyTypes).toBeDefined()
    })

    it('should resolve key', async (): Promise<void> => {
      const result = await agent.kmsClientResolveKey({
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
      const result = await agent.kmsClientCreateRawSignature({
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
      const result = await agent.kmsClientIsValidRawSignature({
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
      const storeResult = await agent.kmsClientStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientGetKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        aliasOrKid: storeResult.keyInfo.alias,
      })

      expect(result.keyInfo.key).toBeDefined()
      expect(result.keyInfo.alias).toBeDefined()
      expect(result.keyInfo.providerId).toBeDefined()
      expect(result.keyInfo.kid).toBeDefined()
      expect(result.keyInfo.signatureAlgorithm).toBeDefined() // TODO this seems to be null?
      expect(result.keyInfo.keyVisibility).toBeDefined() // TODO this seems to be null?
      expect(result.keyInfo.keyType).toBeDefined()
      expect(result.keyInfo.keyEncoding).toBeDefined()
    })

    it('should list keys', async (): Promise<void> => {
      const storeResult = await agent.kmsClientStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should list keys with provider id', async (): Promise<void> => {
      const storeResult = await agent.kmsClientStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should store key', async (): Promise<void> => {
      const result = await agent.kmsClientStoreKey({
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

      expect(result.keyInfo.key).toBeDefined()
      expect(result.keyInfo.alias).toBeDefined()
      expect(result.keyInfo.providerId).toBeDefined()
      expect(result.keyInfo.kid).toBeDefined()
      expect(result.keyInfo.x5c).toBeDefined()
      expect(result.keyInfo.keyType).toBeDefined()
      expect(result.keyInfo.keyEncoding).toBeDefined()
      expect(result.keyInfo.opts).toBeDefined()
    })

    it('should generate key', async (): Promise<void> => {
      const result = await agent.kmsClientGenerateKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        use: 'sig',
        alg: 'ECDSA_SHA256',
        keyOperations: ['sign'],
      })

      expect(result.keyPair.providerId).toBeDefined()
      expect(result.keyPair.alias).toBeDefined()
      expect(result.keyPair.cose).toBeDefined()
      expect(result.keyPair.jose).toBeDefined()
      expect(result.keyPair.kid).toBeDefined()
    })

    it('should delete key', async (): Promise<void> => {
      const storeResult = await agent.kmsClientStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientDeleteKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        aliasOrKid: storeResult.keyInfo.alias,
      })

      expect(result).toBeTruthy()
    })

    it('should get provider by id', async (): Promise<void> => {
      const result = await agent.kmsClientGetKeyProvider({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.providerId).toBeDefined()
      expect(result.type).toBeDefined()
    })

    it('should list providers', async () => {
      const result = await agent.kmsClientListKeyProviders({
        baseUrl: 'https://ssi-backend.sphereon.com',
      })

      expect(result.providers.length).toBeGreaterThan(0)
    })

    it('should list provider keys', async () => {
      const storeResult = await agent.kmsClientProviderStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientProviderListKeys({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
      })

      expect(result.keyInfos.length).toBeGreaterThan(0)
    })

    it('should store provider key', async (): Promise<void> => {
      const result = await agent.kmsClientProviderStoreKey({
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

      expect(result.keyInfo.key).toBeDefined()
      expect(result.keyInfo.alias).toBeDefined()
      expect(result.keyInfo.providerId).toBeDefined()
      expect(result.keyInfo.kid).toBeDefined()
      expect(result.keyInfo.x5c).toBeDefined()
      expect(result.keyInfo.keyType).toBeDefined()
      expect(result.keyInfo.keyEncoding).toBeDefined()
      expect(result.keyInfo.opts).toBeDefined()
    })

    it('should generate provider key', async (): Promise<void> => {
      const result = await agent.kmsClientProviderGenerateKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        use: 'sig',
        alg: 'ECDSA_SHA256',
        keyOperations: ['sign'],
      })

      expect(result.keyPair.providerId).toBeDefined()
      expect(result.keyPair.alias).toBeDefined()
      expect(result.keyPair.cose).toBeDefined()
      expect(result.keyPair.jose).toBeDefined()
      expect(result.keyPair.kid).toBeDefined()
    })

    it('should get provider key by alias or kid', async (): Promise<void> => {
      const storeResult = await agent.kmsClientProviderStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientProviderGetKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        aliasOrKid: storeResult.keyInfo.alias,
      })

      expect(result.keyInfo.key).toBeDefined()
      expect(result.keyInfo.alias).toBeDefined()
      expect(result.keyInfo.providerId).toBeDefined()
      expect(result.keyInfo.kid).toBeDefined()
      expect(result.keyInfo.signatureAlgorithm).toBeDefined()
      expect(result.keyInfo.keyVisibility).toBeDefined()
      expect(result.keyInfo.keyType).toBeDefined()
      expect(result.keyInfo.keyEncoding).toBeDefined()
    })

    it('should delete provider key', async (): Promise<void> => {
      const storeResult = await agent.kmsClientProviderStoreKey({
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

      expect(storeResult.keyInfo).toBeDefined()

      const result = await agent.kmsClientProviderDeleteKey({
        baseUrl: 'https://ssi-backend.sphereon.com',
        providerId: 'test-software',
        aliasOrKid: storeResult.keyInfo.alias,
      })

      expect(result).toBeTruthy()
    })
  })
}
