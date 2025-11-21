// @ts-ignore
import nock from 'nock'

export const createMocks = (): void => {
  nock('https://ssi-backend.sphereon.com')
    .post('/keys/generate', {
      use: "sig",
      alg: "RSA_SSA_PSS_SHA256_MGF1",
      keyOperations: [
        "sign"
      ]
    })
    .times(1)
    .reply(201, {
      keyPair: {
        providerId: "test-software",
        alias: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo",
        cose: {
          publicCoseKey: {
            kty: "3",
            kid: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo",
            alg: -37,
            key_ops: [
              1
            ]
          },
          privateCoseKey: {
            kty: "3",
            kid: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo",
            alg: -37,
            key_ops: [
              1
            ],
            d: "Ylzyxpjnx8EI0sYiKF9lBEreh5O6BupsSXqHWeU6p5kt-crbSSoKT87y6IvxUVlTQoqWkAvoW0WSNn4nJfD7u7zeS1DubJiiaETW89jdekB2Abl-yFcQVgaLqxgW0tj7XxRzOT_aLXDrIReI5xirWK2BSS4erJiQSAX9NGXSUTVrG3wpZTXapMFNlpr8ThAe4BMEzt_B0zypRTDY_X9tewciSb673pp5pcUFVHHpo_os9FWGR0UG82S93nUwfcT1FUxnTzs_PpZaahJWZbNOZgfyoBTxCa-iH7SadnkMVMID44kr9Z53XQjxbb9tpaUIMk5_T7WZ_V7USRBjTe9xdQ"
          }
        },
        jose: {
          publicJwk: {
            kty: "RSA",
            kid: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo",
            alg: "PS256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            n: "xgQtOlp3S9XS-K--T7O73f8wS0G-nHlIOf4ijloK79rNP31QsFAMJ-z1v-8Xl9f2mBTExLREyNIIejwjWwW64m3_GuEuMe0yuDUGrn4AUsWdXDp6UzowLlrmpxmUZtK3FMg5y5LpUtoQAqnCeuOjsRZjLmoMLbKE0jJSMYyBPSDx6jFZO84poZB6RGjVQFcv9rlPjTltD3pjvDkQL1sL6fgJVKzCgv0p94K9ojlXNjKnBf8dmrluH_BxHZV9yV8UoQZw4H2Ruk0cJwjWSAS4QP5-1xbjZ8Q-xAq_eEvZv4He3GuFL67A0R965WpwXdxvldVaofyH_n8LuLk17BAV_Q",
            e: "AQAB"
          },
          privateJwk: {
            kty: "RSA",
            kid: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo",
            alg: "PS256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            d: "Ylzyxpjnx8EI0sYiKF9lBEreh5O6BupsSXqHWeU6p5kt-crbSSoKT87y6IvxUVlTQoqWkAvoW0WSNn4nJfD7u7zeS1DubJiiaETW89jdekB2Abl-yFcQVgaLqxgW0tj7XxRzOT_aLXDrIReI5xirWK2BSS4erJiQSAX9NGXSUTVrG3wpZTXapMFNlpr8ThAe4BMEzt_B0zypRTDY_X9tewciSb673pp5pcUFVHHpo_os9FWGR0UG82S93nUwfcT1FUxnTzs_PpZaahJWZbNOZgfyoBTxCa-iH7SadnkMVMID44kr9Z53XQjxbb9tpaUIMk5_T7WZ_V7USRBjTe9xdQ",
            n: "xgQtOlp3S9XS-K--T7O73f8wS0G-nHlIOf4ijloK79rNP31QsFAMJ-z1v-8Xl9f2mBTExLREyNIIejwjWwW64m3_GuEuMe0yuDUGrn4AUsWdXDp6UzowLlrmpxmUZtK3FMg5y5LpUtoQAqnCeuOjsRZjLmoMLbKE0jJSMYyBPSDx6jFZO84poZB6RGjVQFcv9rlPjTltD3pjvDkQL1sL6fgJVKzCgv0p94K9ojlXNjKnBf8dmrluH_BxHZV9yV8UoQZw4H2Ruk0cJwjWSAS4QP5-1xbjZ8Q-xAq_eEvZv4He3GuFL67A0R965WpwXdxvldVaofyH_n8LuLk17BAV_Q",
            e: "AQAB",
            p: "8WpLEifhACmoG7MAYnGbFmafXnCnKGRGCwInopQmVTOkUB52VkWEH7MZQlG-SqSvBWrqwnW0oXhoIvfIk1T-BbP3jJtdbl18SSsgifhc6P6BrI3-TKDNGWmq84MpqcxzoQaxbQ_W6F-RdEPDcxdDdtinoS892_kNGYN_6-lvXOs",
            q: "0fquDcHL_pFMuuM3b20CoQ0sR90lmG6ah8CeF1DsRDLbuOPrcDtw-FYVjXO7OS_7s4vqKbUqDjXHoP9ErdmcnlUvMM01eesuiOvQAvWEaCY7G58ShnKJTvTth3kEoSfTXI_BiYT1QWs85rUlt14ewa7ijR6QxDvKvqmptFbrfrc",
            dp: "Tlj1thW1Is1iHmMwa8J8139El2yuAyDPzoDLhirYaexRliLcutDiuTrxpqFKxYS-vF5fg-6ZSZH_EeIieRYrPoSSgVJmtwul60UQ0VYGKSN3yB1o-0twZJ_zeAYIPm_40riOWlu6nj1twjK_uplBLs_PTzM6uyoPg0k2-cQPfTM",
            qi: "Iz-PnYZsQo3bn4lv_QDcJtFF42isfNiyCAKPe9tX6ogoTjJY1-DdLwop-VsOzLG4-0xKB0trONPiABKCLvZ_51g703oeS_VfK4dyzQFxg22Hj0x0ZTQshUE5C4JaGZqpeJwmGJtmplP9CthqOga-tj-Z_GP4R_KtKUTcYqrtpHw"
          }
        },
        kid: "0yRvXRmowvtRKA-HucNhLJH5lQTgS9_PAQsmrdx2TTo"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys/generate', {
      use: "sig",
      alg: "ECDSA_SHA256",
      keyOperations: [
        "sign"
      ]
    })
    .times(2)
    .reply(201, {
      keyPair: {
        providerId: "test-software",
        alias: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo",
        cose: {
          publicCoseKey: {
            kty: "2",
            kid: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo",
            alg: -7,
            key_ops: [
              1
            ],
            crv: 1,
            x: "Tby4tQmYR5t2_xbC6UnYsCn0uBap_cutnL_y86lGTp4",
            y: "M1_m8961dRg6ZURwLiwgbef1BRoC-3K9NzD2N5LemyU"
          },
          privateCoseKey: {
            kty: "2",
            kid: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo",
            alg: -7,
            key_ops: [
              1
            ],
            crv: 1,
            x: "Tby4tQmYR5t2_xbC6UnYsCn0uBap_cutnL_y86lGTp4",
            y: "M1_m8961dRg6ZURwLiwgbef1BRoC-3K9NzD2N5LemyU",
            d: "O_aMiDg_giOyQ-biAq1vV-GpIgVoCiuzUlpCl04m4tc"
          }
        },
        jose: {
          publicJwk: {
            kty: "EC",
            kid: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo",
            alg: "ES256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            crv: "P-256",
            x: "Tby4tQmYR5t2_xbC6UnYsCn0uBap_cutnL_y86lGTp4",
            y: "M1_m8961dRg6ZURwLiwgbef1BRoC-3K9NzD2N5LemyU"
          },
          privateJwk: {
            kty: "EC",
            kid: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo",
            alg: "ES256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            crv: "P-256",
            x: "Tby4tQmYR5t2_xbC6UnYsCn0uBap_cutnL_y86lGTp4",
            y: "M1_m8961dRg6ZURwLiwgbef1BRoC-3K9NzD2N5LemyU",
            d: "O_aMiDg_giOyQ-biAq1vV-GpIgVoCiuzUlpCl04m4tc"
          }
        },
        kid: "gSUQD18FApKFmt9hyAApgo-D4ceWVFU_uhhgFOxazSo"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys/generate', {
      use: "sig",
      alg: "ECKA_DH_SHA256",
      keyOperations: [
        "sign"
      ]
    })
    .times(1)
    .reply(201, {
      keyPair: {
        providerId: "test-software",
        alias: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g",
        cose: {
          publicCoseKey: {
            kty: "2",
            kid: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g",
            alg: -7,
            key_ops: [
              1
            ],
            crv: 1,
            x: "4nXmSeFgetoEIdnuL9XaknxqSyojdysqCDLwJoYcN5A",
            y: "PDAO3J5nu9AQaZbT4xzshiqDCK0cdXdPnDuVUSTuPbw"
          },
          privateCoseKey: {
            kty: "2",
            kid: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g",
            alg: -7,
            key_ops: [
              1
            ],
            crv: 1,
            x: "4nXmSeFgetoEIdnuL9XaknxqSyojdysqCDLwJoYcN5A",
            y: "PDAO3J5nu9AQaZbT4xzshiqDCK0cdXdPnDuVUSTuPbw",
            d: "qPVTCwzsmRGtuzcrtjqLkF54lPgJBZLnlLuzcmpfYAE"
          }
        },
        jose: {
          publicJwk: {
            kty: "EC",
            kid: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g",
            alg: "ES256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            crv: "P-256",
            x: "4nXmSeFgetoEIdnuL9XaknxqSyojdysqCDLwJoYcN5A",
            y: "PDAO3J5nu9AQaZbT4xzshiqDCK0cdXdPnDuVUSTuPbw"
          },
          privateJwk: {
            kty: "EC",
            kid: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g",
            alg: "ES256",
            use: "sig",
            key_ops: [
              "sign"
            ],
            crv: "P-256",
            x: "4nXmSeFgetoEIdnuL9XaknxqSyojdysqCDLwJoYcN5A",
            y: "PDAO3J5nu9AQaZbT4xzshiqDCK0cdXdPnDuVUSTuPbw",
            d: "qPVTCwzsmRGtuzcrtjqLkF54lPgJBZLnlLuzcmpfYAE"
          }
        },
        kid: "WbhvJgdvdKDAKCMfDUBz8_ODv5rGuA8-JQ0amnh435g"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys', {
      keyInfo: {
        key: {
          kty: "RSA",
          kid: "test",
          n: "1esfhwiRSpFYG3lFsvYgljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ-tnExDYACNG-lQf4k7asMqXWFEMU2oxIZ1Jv_RXkH_L4_At-DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc_ANWM3N0qrsPLkHxSlajwgysup1Y4U3gx4_bcQSU36Jh_lmB6Q97LpkV7txgecWUBsAuh9t3K2iaVdUcNw_8-5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqVbVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAkUw",
          e: "AQAB"
        }
      },
      certChain: [
        "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"
      ]
    })
    .times(1)
    .reply(201, {
      keyInfo: {
        key: {
          kty: "RSA",
          kid: "test",
          n: "1esfhwiRSpFYG3lFsvYgljhZtSebzZ2zgwzGrBz46fJuz49swanZFLCZ-tnExDYACNG-lQf4k7asMqXWFEMU2oxIZ1Jv_RXkH_L4_At-DiPPND3oYHr4gkKwpVqy84w3HBL6EFUirc_ANWM3N0qrsPLkHxSlajwgysup1Y4U3gx4_bcQSU36Jh_lmB6Q97LpkV7txgecWUBsAuh9t3K2iaVdUcNw_8-5xZapYPQEGcEp47yPixOJ2SmXpoR2iTpvZK4ZNyF3JxqKQg2pGJqVbVovthSwdxQkOqF21obQd6IiJcvDmnHSxLo6DiHBGYEYxJO83PSkTY3Xyh7yZMAkUw",
          e: "AQAB"
        },
        alias: "test",
        providerId: "test-software"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys', {
      keyInfo: {
        key: {
          alg: "ES256",
          kty: "EC",
          crv: "P-256",
          x: "i9AvjI0WcQz94_ZVECk5kKmdHADSdV4dJgTM7DNbCIk",
          y: "IdkrZKTqgf4MYcxTlyH3vI2GGb2Wac5gEucIPi1_Fkg",
          d: "fdkj5A9GFaxJYRn355PMKJnpm2S4jKhgPbmGcACJUys",
          kid: "test"
        }
      }
    })
    .times(4)
    .reply(201, {
      keyInfo: {
        key: {
          kty: "EC",
          kid: "test",
          alg: "ES256",
          crv: "P-256",
          x: "i9AvjI0WcQz94_ZVECk5kKmdHADSdV4dJgTM7DNbCIk",
          y: "IdkrZKTqgf4MYcxTlyH3vI2GGb2Wac5gEucIPi1_Fkg",
          d: "fdkj5A9GFaxJYRn355PMKJnpm2S4jKhgPbmGcACJUys"
        },
        alias: "test",
        providerId: "test-software"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/keys', {
      keyInfo: {
        key: {
          alg: "EdDSA",
          kty: "OKP",
          crv: "X25519",
          x: "L-V9o0fNYkMVKNqsX7spBzD_9oSvxM_C7ZCZX1jLO3Q",
          kid: "test"
        }
      }
    })
    .times(1)
    .reply(201, {
      keyInfo: {
        key: {
          kty: "OKP",
          kid: "test",
          alg: "EdDSA",
          crv: "X25519",
          x: "L-V9o0fNYkMVKNqsX7spBzD_9oSvxM_C7ZCZX1jLO3Q"
        },
        alias: "test",
        providerId: "test-software"
      }
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

  nock('https://ssi-backend.sphereon.com').delete('/keys/test').times(1).reply(204)

  nock('https://ssi-backend.sphereon.com')
    .get('/keys/test')
    .times(3)
    .reply(200, {
      keyInfo: {
        key: {
          kty: "EC",
          kid: "test",
          alg: "ES256",
          crv: "P-256",
          x: "i9AvjI0WcQz94_ZVECk5kKmdHADSdV4dJgTM7DNbCIk",
          y: "IdkrZKTqgf4MYcxTlyH3vI2GGb2Wac5gEucIPi1_Fkg",
          d: "fdkj5A9GFaxJYRn355PMKJnpm2S4jKhgPbmGcACJUys"
        },
        alias: "test",
        providerId: "test-software"
      }
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/signatures/raw/create', {
        keyInfo: {
          key: {
            kty: "EC",
            kid: "test",
            alg: "ES256",
            crv: "P-256",
            x: "i9AvjI0WcQz94_ZVECk5kKmdHADSdV4dJgTM7DNbCIk",
            y: "IdkrZKTqgf4MYcxTlyH3vI2GGb2Wac5gEucIPi1_Fkg",
            d: "fdkj5A9GFaxJYRn355PMKJnpm2S4jKhgPbmGcACJUys"
          },
          alias: "test",
          providerId: "test-software"
        },
        input: 'test',
      })
    .times(2)
    .reply(201, {
      signature: 'DEnlZ+Ci41YL6WOt+mGipruejMxG/bN0dBbGZvWzUUB2u1813UWAt7G7Ee0q+MReUbp8aRa3qTehcdyHHthN7g==',
    })

  nock('https://ssi-backend.sphereon.com')
    .post('/signatures/raw/verify', {
        keyInfo: {
          key: {
            kty: "EC",
            kid: "test",
            alg: "ES256",
            crv: "P-256",
            x: "i9AvjI0WcQz94_ZVECk5kKmdHADSdV4dJgTM7DNbCIk",
            y: "IdkrZKTqgf4MYcxTlyH3vI2GGb2Wac5gEucIPi1_Fkg",
            d: "fdkj5A9GFaxJYRn355PMKJnpm2S4jKhgPbmGcACJUys"
          },
          alias: "test",
          providerId: "test-software"
        },
        input: 'test',
        signature: 'DEnlZ+Ci41YL6WOt+mGipruejMxG/bN0dBbGZvWzUUB2u1813UWAt7G7Ee0q+MReUbp8aRa3qTehcdyHHthN7g==',
      })
    .times(1)
    .reply(201, {
      isValid: true,
    })

}


