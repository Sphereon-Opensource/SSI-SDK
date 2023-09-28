// import { Ed25519Signature2018 } from '@sphereon/ed25519-signature-2018'
import { Ed25519Signature2018, Ed25519VerificationKey2018 } from '@transmute/ed25519-signature-2018'
import { IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import suiteContext2018 from 'ed25519-signature-2018-context'
import * as u8a from 'uint8arrays'

import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'

export class SphereonEd25519Signature2018 extends SphereonLdSignature {
  constructor() {
    super()
    // Ensure it is loaded
    suiteContext2018?.constants
  }

  getSupportedVerificationType(): string {
    return 'Ed25519VerificationKey2018'
  }

  getSupportedVeramoKeyType(): TKeyType {
    return 'Ed25519'
  }

  getContext(): string {
    return 'https://w3id.org/security/suites/ed25519-2018/v1'
  }

  getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string, context: IAgentContext<RequiredAgentMethods>): any {
    const controller = issuerDid

    // DID Key ID
    const id = verificationMethodId

    const signer = {
      // returns a JWS detached
      sign: async (args: { data: Uint8Array }): Promise<string> => {
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
        return `${headerString}..${signature}`
        // return u8a.fromString(`${headerString}..${signature}`)
      },
    }

    const options = {
      id,
      controller,
      publicKey: u8a.fromString(key.publicKeyHex, 'base16'),
      signer: () => signer,
      type: this.getSupportedVerificationType(),
    }

    // For now we always go through this route given the multibase key has an invalid header
    const verificationKey = new Ed25519VerificationKey2018(options)
    // overwrite the signer since we're not passing the private key and transmute doesn't support that behavior
    verificationKey.signer = () => signer as any
    // verificationKey.type = this.getSupportedVerificationType()

    return new Ed25519Signature2018({ key: verificationKey, signer: signer })
  }

  preVerificationCredModification(credential: VerifiableCredential): void {
    const vcJson = JSON.stringify(credential)
    if (vcJson.indexOf('Ed25519Signature2018 DISABLED!!!!!') > -1) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
      }
      // Gives a JSON-LD redefinement on a protected term. Probably better to not have the Es25519Signature2018 context though!
      const v1Idx = vcJson.indexOf('https://w3id.org/security/v1')
      if (v1Idx > -1 && Array.isArray(credential['@context'])) {
        delete credential['@context'][v1Idx]
      }
      const v3Idx = vcJson.indexOf('https://w3id.org/security/v3-unstable')
      if (v3Idx === -1 && Array.isArray(credential['@context'])) {
        credential['@context'].push('https://w3id.org/security/v3-unstable')
      }
    }
  }

  getSuiteForVerification(): any {
    return new Ed25519Signature2018()
  }

  // preSigningCredModification(credential: CredentialPayload): void {
  preSigningCredModification(): void {
    // nothing to do here
  }

  // preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void {
  preDidResolutionModification(): void {
    // nothing to do here
  }
}
