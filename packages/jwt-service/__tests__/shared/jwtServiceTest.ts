import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { JWK } from '@sphereon/ssi-types'
import { IDIDManager, IKeyManager, TAgent } from '@veramo/core'
import { decodeJwt } from 'jose'
import { describe } from 'node:test'
import * as u8a from 'uint8arrays'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { IJwtService } from '../../src'

type ConfiguredAgent = TAgent<IKeyManager & IDIDManager & IIdentifierResolution & IJwtService>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  let agent: ConfiguredAgent
  // let key: IKey

  const ietfJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
    y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
    // d: 'jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI',
  }
  // tbe above key as hex
  const privateKeyHex = '8E9B109E719098BF980487DF1F5D77E9CB29606EBED2263B5F57C213DF84F4B2'.toLowerCase()
  const publicKeyHex = '037fcdce2770f6c45d4183cbee6fdb4b7b580733357be9ef13bacf6e3c7bd15445'
  const kid = publicKeyHex

  beforeAll(async () => {
    await testContext.setup().then(() => (agent = testContext.getAgent()))
    await agent.keyManagerImport({ kid: 'test', type: 'Secp256r1', kms: 'local', privateKeyHex })
  })
  afterAll(testContext.tearDown)

  describe('jwt-service', () => {
    it('should sign with ietf key', async () => {
      const jwt = await agent.jwtCreateJwsCompactSignature({
        // Example payloads from IETF spec
        issuer: { identifier: kid, noIdentifierInHeader: true },
        protectedHeader: { alg: 'ES256' },
        payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
      })

      const [header, payload, signature] = jwt.jwt.split('.')
      expect(header).toStrictEqual('eyJhbGciOiJFUzI1NiJ9')
      expect(payload).toStrictEqual('eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ')
      // ES256 uses a nonce, so the signature will never be the same as the ietf version
      expect(signature).toEqual('e4ZrhZdbFQ7630Tq51E6RQiJaae9bFNGJszIhtusEwzvO21rzH76Wer6yRn2Zb34VjIm3cVRl0iQctbf4uBY3w')
    })

    it('should verify with ietf jwk', async () => {
      const jwt = await agent.jwtCreateJwsCompactSignature({
        // Example payloads from IETF spec
        issuer: { identifier: kid, noIdentifierInHeader: true },
        protectedHeader: { alg: 'ES256' },
        payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
      })

      const result = await agent.jwtVerifyJwsSignature({
        jws: jwt.jwt,
        jwk: ietfJwk as JWK,
      })

      expect(result).toMatchObject({
        critical: false,
        error: false,
        jws: {
          payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
          signatures: [
            {
              identifier: {
                jwk: {
                  crv: 'P-256',
                  kty: 'EC',
                  x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
                  y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
                },
                jwks: [
                  {
                    jwk: {
                      crv: 'P-256',
                      kty: 'EC',
                      x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
                      y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
                    },
                    jwkThumbprint: 'oKIywvGUpTVTyxMQ3bwIIeQUudfr_CkLMjCE19ECD-U',
                    publicKeyHex: '037fcdce2770f6c45d4183cbee6fdb4b7b580733357be9ef13bacf6e3c7bd15445',
                  },
                ],
                method: 'jwk',
              },
              protected: 'eyJhbGciOiJFUzI1NiJ9',
              signature: 'e4ZrhZdbFQ7630Tq51E6RQiJaae9bFNGJszIhtusEwzvO21rzH76Wer6yRn2Zb34VjIm3cVRl0iQctbf4uBY3w',
            },
          ],
        },
        message: 'Signature validated',
        name: 'jws',
        // verificationTime: expect.any(Date),
      })
    })

    it('should encrypt with public key', async () => {
      const jwt = await agent.jwtCreateJwsCompactSignature({
        // Example payloads from IETF spec
        issuer: { identifier: kid, noIdentifierInHeader: true },
        protectedHeader: { alg: 'ES256' },
        payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
      })

      const [header, payload, signature] = jwt.jwt.split('.')
      expect(header).toStrictEqual('eyJhbGciOiJFUzI1NiJ9')
      expect(payload).toStrictEqual('eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ')
      // ES256 uses a nonce, so the signature will never be the same as the ietf version
      expect(signature).toEqual('e4ZrhZdbFQ7630Tq51E6RQiJaae9bFNGJszIhtusEwzvO21rzH76Wer6yRn2Zb34VjIm3cVRl0iQctbf4uBY3w')

      const jwe = await agent.jwtEncryptJweCompactJwt({
        alg: 'ECDH-ES',
        enc: 'A256GCM',
        payload: decodeJwt(jwt.jwt),
        apu: u8a.toString(u8a.fromString('apu'), 'base64url'),
        apv: u8a.toString(u8a.fromString('apv'), 'base64url'),
        // @ts-ignore
        recipientKey: await agent.identifierExternalResolveByJwk({ identifier: ietfJwk }),
      })

      console.log(jwe)
    })
  })
}
