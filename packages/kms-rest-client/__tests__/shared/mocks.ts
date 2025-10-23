// @ts-ignore
import nock from 'nock'
import { CreateRawSignatureToJSONTyped, ResolvePublicKeyToJSONTyped, StoreKeyToJSONTyped, VerifyRawSignatureToJSONTyped } from '../../src/models'

export const createMocks = (): void => {
  nock('https://ssi-backend.sphereon.com')
    .get('/resolvers')
    .times(1)
    .reply(200, {
      resolvers: [
        {
          resolverId: 'jose_cose_resolver',
          supportedIdentifierMethods: ['JWK', 'COSE_KEY'],
          supportedKeyTypes: ['OKP', 'EC', 'RSA'],
        },
      ],
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/resolvers/jose_cose_resolver')
    .times(1)
    .reply(200, {
      resolverId: 'jose_cose_resolver',
      supportedIdentifierMethods: ['JWK', 'COSE_KEY'],
      supportedKeyTypes: ['OKP', 'EC', 'RSA'],
    })

  nock('https://ssi-backend.sphereon.com')
    .post(
      '/resolvers/jose_cose_resolver/resolve',
      ResolvePublicKeyToJSONTyped({
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
      }),
    )
    .times(1)
    .reply(200, {
      key: {
        kty: 'EC',
        kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
        use: 'sig',
        key_ops: ['sign'],
        crv: 'P-256',
        x: 'DwRiRyvtMXhFwCKuoAMnpviMmrE1B0Fu44_LeQEycEs',
        y: '3BnhvdB6QYGp7x9Ey7qW_TNZ0MI0hNZgLlyl6rbxln8',
      },
      kid: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
      alias: 'HAnuRAJHmahYSmnfcmX9lF25bRsi_IWoFkJ2KueEXOU',
      providerId: 'test-software',
      keyType: 'EC',
      keyEncoding: 'JOSE',
    })

  nock('https://ssi-backend.sphereon.com')
    .post(
      '/signatures/raw',
      CreateRawSignatureToJSONTyped({
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
      }),
    )
    .times(1)
    .reply(201, {
      signature: 'DEnlZ+Ci41YL6WOt+mGipruejMxG/bN0dBbGZvWzUUB2u1813UWAt7G7Ee0q+MReUbp8aRa3qTehcdyHHthN7g==',
    })

  nock('https://ssi-backend.sphereon.com')
    .post(
      '/signatures/raw/verify',
      VerifyRawSignatureToJSONTyped({
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
      }),
    )
    .times(1)
    .reply(201, {
      isValid: true,
    })

  nock('https://ssi-backend.sphereon.com')
    .post(
      '/keys',
      StoreKeyToJSONTyped({
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
      }),
    )
    .times(5)
    .reply(201, {
      key: {
        kty: 'EC',
        kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
        use: 'sig',
        key_ops: ['sign'],
        crv: 'P-256',
        x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
        y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
        d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
      },
      alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
      providerId: 'test-software',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      x5c: ['1', '2'],
      keyType: 'EC',
      keyEncoding: 'JOSE',
      opts: {
        test: 'test',
      },
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/keys/Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4')
    .times(1)
    .reply(200, {
      key: {
        kty: 'EC',
        kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
        use: 'sig',
        key_ops: ['sign'],
        crv: 'P-256',
        x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
        y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
        d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
      },
      alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
      providerId: 'test-software',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      signatureAlgorithm: 'ECDSA_SHA256',
      keyVisibility: 'PUBLIC',
      x5c: ['1', '2'],
      keyType: 'EC',
      keyEncoding: 'JOSE',
      opts: {
        test: 'test',
      },
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/keys')
    .times(1)
    .reply(200, {
      keyInfos: [
        {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            key_ops: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyType: 'EC',
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
        },
      ],
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/keys?providerId=test-software')
    .times(1)
    .reply(200, {
      keyInfos: [
        {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            key_ops: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          signatureAlgorithm: 'ECDSA_SHA256',
          keyVisibility: 'PUBLIC',
          x5c: ['1', '2'],
          keyType: 'EC',
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
        },
      ],
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys/generate', {
      use: 'sig',
      alg: 'ECDSA_SHA256',
      keyOperations: ['sign'],
    })
    .times(1)
    .reply(201, {
      providerId: 'test-software',
      alias: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
      cose: {
        publicCoseKey: {
          kty: '2',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: -7,
          key_ops: [1],
          crv: 1,
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
        },
        privateCoseKey: {
          kty: '2',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: -7,
          key_ops: [1],
          crv: 1,
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
          d: 'uvRaCWxTlTFJB9AOvtpC8HMDMWgi_3u5NRj2WFwgnz4',
        },
      },
      jose: {
        publicJwk: {
          kty: 'EC',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: 'ES256',
          use: 'sig',
          key_ops: ['sign'],
          crv: 'P-256',
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
        },
        privateJwk: {
          kty: 'EC',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: 'ES256',
          use: 'sig',
          key_ops: ['sign'],
          crv: 'P-256',
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
          d: 'uvRaCWxTlTFJB9AOvtpC8HMDMWgi_3u5NRj2WFwgnz4',
        },
      },
      kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
    })

  nock('https://ssi-backend.sphereon.com').delete('/keys/Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4').times(1).reply(204)

  nock('https://ssi-backend.sphereon.com').get('/providers/test-software').times(1).reply(200, {
    providerId: 'test-software',
    type: 'SOFTWARE',
  })

  nock('https://ssi-backend.sphereon.com')
    .get('/providers')
    .times(1)
    .reply(200, {
      providers: [
        {
          providerId: 'test-software',
          type: 'SOFTWARE',
        },
      ],
    })

  nock('https://ssi-backend.sphereon.com')
    .post(
      '/providers/test-software/keys',
      StoreKeyToJSONTyped({
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
      }),
    )
    .times(4)
    .reply(201, {
      key: {
        kty: 'EC',
        kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
        use: 'sig',
        key_ops: ['sign'],
        crv: 'P-256',
        x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
        y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
        d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
      },
      alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
      providerId: 'test-software',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      x5c: ['1', '2'],
      keyType: 'EC',
      keyEncoding: 'JOSE',
      opts: {
        test: 'test',
      },
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/providers/test-software/keys')
    .times(1)
    .reply(200, {
      keyInfos: [
        {
          key: {
            kty: 'EC',
            kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
            use: 'sig',
            key_ops: ['sign'],
            crv: 'P-256',
            x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
            y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
            d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
          },
          alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
          providerId: 'test-software',
          kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
          x5c: ['1', '2'],
          keyType: 'EC',
          keyEncoding: 'JOSE',
          opts: {
            test: 'test',
          },
        },
      ],
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/providers/test-software/keys/generate', {
      use: 'sig',
      alg: 'ECDSA_SHA256',
      keyOperations: ['sign'],
    })
    .times(1)
    .reply(201, {
      providerId: 'test-software',
      alias: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
      cose: {
        publicCoseKey: {
          kty: '2',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: -7,
          key_ops: [1],
          crv: 1,
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
        },
        privateCoseKey: {
          kty: '2',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: -7,
          key_ops: [1],
          crv: 1,
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
          d: 'uvRaCWxTlTFJB9AOvtpC8HMDMWgi_3u5NRj2WFwgnz4',
        },
      },
      jose: {
        publicJwk: {
          kty: 'EC',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: 'ES256',
          use: 'sig',
          key_ops: ['sign'],
          crv: 'P-256',
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
        },
        privateJwk: {
          kty: 'EC',
          kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
          alg: 'ES256',
          use: 'sig',
          key_ops: ['sign'],
          crv: 'P-256',
          x: '8HlRxDR6JZHqL-uyqeXwoqqty05aM24_vQGV_I1E7TE',
          y: 'KzWXQt-Kn82XxkGGfv8c2NiAJiR4ezr9-Eis7bvCcQY',
          d: 'uvRaCWxTlTFJB9AOvtpC8HMDMWgi_3u5NRj2WFwgnz4',
        },
      },
      kid: '-IXw08HBMMyp8PhQ4GYjh1nqKSr04W5pj75u7A2sWuc',
    })

  nock('https://ssi-backend.sphereon.com')
    .get('/providers/test-software/keys/Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4')
    .times(1)
    .reply(200, {
      key: {
        kty: 'EC',
        kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
        use: 'sig',
        key_ops: ['sign'],
        crv: 'P-256',
        x: 'HFL67WWh6PYWKOy1mzt9Y2ANs-CWFIyVtouR-Jx_mAM',
        y: '9f_1x7fwUuEbEwxSNTYE3jQF-zForWpKkEMpiUp1MNI',
        d: 'P_4YEyuDj4aA4IVYVku4dm3BoDReFTKVsBwb1utoWCQ',
      },
      alias: 'Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4',
      providerId: 'test-software',
      kid: '00-qTBov6GxjPSuMNxnk876cMP0JKjbwl4ZyN_sY2tE',
      signatureAlgorithm: 'ECDSA_SHA256',
      keyVisibility: 'PUBLIC',
      x5c: ['1', '2'],
      keyType: 'EC',
      keyEncoding: 'JOSE',
      opts: {
        test: 'test',
      },
    })

  nock('https://ssi-backend.sphereon.com').delete('/providers/test-software/keys/Gxq2tXSNl_kp8tKHNzIlO7jQDM-aYcgn1aewGW8Yby4').times(1).reply(204)
}
