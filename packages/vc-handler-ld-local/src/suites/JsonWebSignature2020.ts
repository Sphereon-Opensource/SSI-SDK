import { CredentialPayload, DIDDocument, IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'
import * as u8a from 'uint8arrays'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import { JsonWebKey } from './impl/JsonWebKeyWithRSASupport'
import { JsonWebSignature } from './impl/JsonWebSignatureWithRSASupport'

/**
 * Veramo wrapper for the JsonWebSignature2020 suite by Transmute Industries
 *
 * @alpha This API is experimental and is very likely to change or disappear in future releases without notice.
 */
export class SphereonJsonWebSignature2020 extends SphereonLdSignature {
  getSupportedVerificationType(): 'JsonWebKey2020' {
    return 'JsonWebKey2020'
  }

  getSupportedVeramoKeyType(): TKeyType {
    return 'RSA'
  }

  async getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string, context: IAgentContext<RequiredAgentMethods>): Promise<any> {
    const controller = issuerDid

    // DID Key ID
    let id = verificationMethodId

    let alg = 'RS256'
    if (key.type === 'Ed25519' || key.type === 'X25519') {
      alg = 'EdDSA'
    } else if (key.type === 'Secp256k1') {
      alg = 'ES256k'
      throw Error('ES256k keys not supported yet (to JWK missing)')
    } else if (key.type === 'Secp256r1') {
      alg = 'ES256'
      throw Error('ES256 keys not supported yet (to JWK missing)')
    } else if (key.type === 'Bls12381G1') {
      throw Error('BLS keys as jsonwebkey2020 not implemented yet')
    }

    const signer = {
      // returns a JWS detached
      sign: async (args: { data: Uint8Array }): Promise<string> => {
        const header = {
          alg,
          b64: false,
          crit: ['b64'],
        }
        const headerString = encodeJoseBlob(header)
        const messageBuffer = u8a.concat([u8a.fromString(`${headerString}.`, 'utf-8'), args.data])
        const messageString = u8a.toString(messageBuffer, 'base64')
        const signature = await context.agent.keyManagerSign({
          keyRef: key.kid,
          algorithm: alg,
          data: messageString,
          encoding: 'base64',
        })
        return `${headerString}..${signature}`
      },
    }

    const publicKeyJwk = key.meta?.publicKeyJwk
      ? key.meta.publicKeyJwk
      : {
          kty: 'OKP',
          crv: 'Ed25519',
          x: u8a.toString(u8a.fromString(key.publicKeyHex, 'hex'), 'base64url'),
        }

    const verificationKey = await JsonWebKey.from({
      id: id,
      type: this.getSupportedVerificationType(),
      controller: controller,
      publicKeyJwk,
    }, {signer: () => signer})

    // verificationKey.signer = () => signer

    const suite = new JsonWebSignature({
      key: verificationKey,
    })

    return suite
  }

  getSuiteForVerification(): any {
    return new JsonWebSignature()
  }

  preSigningCredModification(credential: CredentialPayload): void {
    credential['@context'] = [...(credential['@context'] || []), this.getContext()]
  }

  preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void {
    // do nothing
  }

  getContext(): string {
    return 'https://w3id.org/security/suites/jws-2020/v1'
  }

  preVerificationCredModification(credential: VerifiableCredential): void {
    const vcJson = JSON.stringify(credential)
    if (vcJson.indexOf('JsonWebKey2020') > -1) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
      }
    }
  }
}
