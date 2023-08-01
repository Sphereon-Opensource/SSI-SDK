import { JwkKeyUse, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { IProof, IVerifiableCredential } from '@sphereon/ssi-types'
import { CredentialPayload, DIDDocument, IAgentContext, IKey, PresentationPayload, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import * as u8a from 'uint8arrays'

import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'

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
    const id = verificationMethodId

    let alg = 'PS256'
    if (key.type === 'Ed25519' || key.type === 'X25519') {
      alg = 'EdDSA'
    } else if (key.type === 'Secp256k1') {
      alg = 'ES256k'
      throw Error('ES256k keys not supported yet (to JWK missing)')
    } else if (key.type === 'Secp256r1') {
      alg = 'ES256'
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
        const messageString = u8a.toString(messageBuffer, 'base64') //will be decoded to bytes in the keyManagerSign, hence the base64 arg to the method below

        const signature = await context.agent.keyManagerSign({
          keyRef: key.kid,
          algorithm: alg,
          data: messageString,
          encoding: 'base64',
        })
        return `${headerString}..${signature}`
      },
    }

    const publicKeyJwk = key.meta?.publicKeyJwk ?? (await toJwk(key.publicKeyHex, key.type, { use: JwkKeyUse.Signature, key }))
    const verificationKey = await JsonWebKey.from(
      {
        id,
        type: this.getSupportedVerificationType(),
        controller,
        publicKeyJwk,
      },
      { signer, verifier: false }
    )

    // verificationKey.signer = () => signer

    const suite = new JsonWebSignature({
      key: verificationKey,
    })

    return suite
  }

  getSuiteForVerification(): any {
    const verifier = {
      // returns a JWS detached
      verify: async (args: { data: Uint8Array; signature: Uint8Array }): Promise<boolean> => {
        return true
      },
    }
    return new JsonWebSignature({ verifier })
  }

  preSigningCredModification(credential: CredentialPayload): void {
    let context = credential['@context']
    if (Array.isArray(context)) {
      credential['@context'] = [...context, this.getContext()]
    } else if (typeof context === 'string' || typeof context === 'object') {
      credential['@context'] = [this.getContext()]
    } else if (typeof context === 'undefined') {
      credential['@context'] = [this.getContext()]
    }
  }

  preSigningPresModification(presentation: PresentationPayload): void {
    super.preSigningPresModification(presentation)
    let context = presentation['@context']
    if (Array.isArray(context)) {
      presentation['@context'] = [...context, this.getContext()]
    } else if (typeof context === 'string' || typeof context === 'object') {
      presentation['@context'] = [this.getContext()]
    } else if (typeof context === 'undefined') {
      presentation['@context'] = [this.getContext()]
    }
  }

  preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void {
    // do nothing
  }

  getContext(): string {
    return 'https://w3id.org/security/suites/jws-2020/v1'
  }

  preVerificationCredModification(origCredential: VerifiableCredential): void {
    const credential = origCredential as IVerifiableCredential // The original credential interface does not account for multiple proofs
    const vcJson = JSON.stringify(credential)
    if (vcJson.includes('JsonWebSignature2020')) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
        /* if (Array.isArray(credential.proof)) {
          credential.proof.forEach(proof => this.addProofContextIfNeeded(proof))
        } else {
          this.addProofContextIfNeeded(credential.proof)
        }*/
      }
    }
  }

  addProofContextIfNeeded(proof: IProof) {
    if (proof['@context']) {
      if (!proof['@context'].includes(this.getContext())) {
        if (typeof proof['@context'] === 'string') {
          proof['@context'] = [proof['@context'], this.getContext()]
        } else {
          proof['@context'].push(this.getContext())
        }
      }
    } else {
      proof['@context'] = this.getContext()
    }
  }
}
