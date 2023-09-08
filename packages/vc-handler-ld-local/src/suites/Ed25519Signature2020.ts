import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020'
import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020'
import { hexToMultibase } from '@sphereon/ssi-sdk.core'
import { IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import suiteContext2020 from 'ed25519-signature-2020-context'
import * as u8a from 'uint8arrays'

import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'

export class SphereonEd25519Signature2020 extends SphereonLdSignature {
  constructor() {
    super()
    // Ensure it is loaded
    suiteContext2020?.constants
  }

  getSupportedVerificationType(): string {
    return 'Ed25519VerificationKey2020'
  }

  getSupportedVeramoKeyType(): TKeyType {
    return 'Ed25519'
  }

  getContext(): string {
    return 'https://w3id.org/security/suites/ed25519-2020/v1'
  }

  getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string, context: IAgentContext<RequiredAgentMethods>): any {
    const controller = issuerDid

    // DID Key ID
    const id = verificationMethodId

    const signer = {
      // returns a JWS detached
      sign: async (args: { data: Uint8Array }): Promise<Uint8Array> => {
        const header = {
          alg: 'EdDSA',
          b64: false,
          crit: ['b64'],
        }
        const headerString = encodeJoseBlob(header)
        const messageBuffer = u8a.concat([u8a.fromString(`${headerString}.`, 'utf-8'), args.data])
        const messageString = u8a.toString(messageBuffer, 'base64')
        const signature = await context.agent.keyManagerSign({
          keyRef: key.kid,
          algorithm: 'EdDSA',
          data: messageString,
          encoding: 'base64',
        })
        return u8a.fromString(`${headerString}..${signature}`)
      },
    }

    const options = {
      id: id,
      controller: controller,
      publicKeyMultibase: hexToMultibase(key.publicKeyHex, key.type).value,
      signer: () => signer,
      type: this.getSupportedVerificationType(),
    }

    // For now we always go through this route given the multibase key has an invalid header
    const verificationKey = new Ed25519VerificationKey2020(options)
    // overwrite the signer since we're not passing the private key and transmute doesn't support that behavior
    verificationKey.signer = () => signer as any
    // verificationKey.type = this.getSupportedVerificationType()

    return new Ed25519Signature2020({
      key: verificationKey,
      signer: signer,
    })
  }
  preVerificationCredModification(credential: VerifiableCredential): void {
    const vcJson = JSON.stringify(credential)
    if (vcJson.indexOf('Ed25519Signature2020') > -1) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
      }
    }
  }

  getSuiteForVerification(): any {
    return new Ed25519Signature2020()
  }

  // preSigningCredModification(_credential: CredentialPayload): void {}
  preSigningCredModification(): void {}

  // preDidResolutionModification(_didUrl: string, _didDoc: DIDDocument): void {
  preDidResolutionModification(): void {
    // nothing to do here
  }
}
