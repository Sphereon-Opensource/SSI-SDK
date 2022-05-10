import { BbsBlsSignature2020 as MattrBbsBlsSignature2020, Bls12381G2KeyPair } from '@mattrglobal/jsonld-signatures-bbs'
import { IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray } from '@veramo/utils'
import suiteContext2020 from 'ed25519-signature-2020-context'

import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'
import { hexToMultibase, MultibaseFormat } from '@sphereon/ssi-sdk-core'
import {KeyType} from "@sphereon/ssi-sdk-bls-key-manager";

export enum VerificationType {
  Bls12381G2Key2020 = 'Bls12381G2Key2020',
}

export class SphereonBbsBlsSignature2020 extends SphereonLdSignature {
  constructor() {
    super()
    suiteContext2020?.constants
  }

  getSupportedVerificationType(): string {
    return VerificationType.Bls12381G2Key2020
  }

  getSupportedVeramoKeyType(): TKeyType {
    return KeyType.Bls12381G2
  }

  getContext(): string {
    return 'https://w3id.org/security/bbs/v1'
  }

  getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string, context: IAgentContext<RequiredAgentMethods>): any {
    const controller = issuerDid

    const id = verificationMethodId

    if (!key.privateKeyHex) {
      throw new Error('Private key must be defined')
    }

    const options = {
      id: id,
      controller: controller,
      privateKeyBase58: hexToMultibase(key.privateKeyHex, MultibaseFormat.BASE58).value.substring(1),
      publicKeyBase58: hexToMultibase(key.publicKeyHex, MultibaseFormat.BASE58).value.substring(1),
      type: this.getSupportedVerificationType(),
    }

    let key2: Bls12381G2KeyPair = new Bls12381G2KeyPair(options)

    type KeyPairSignerOptions = { data: Uint8Array | Uint8Array[] }

    const options2 = {
      signer: {
        sign: async function (options: KeyPairSignerOptions): Promise<Uint8Array> {
          if (!key2.id) {
            throw new Error('Kid must be present')
          }
          //Options.data needs to be cast to any because the data option does not accept arrays
          return Buffer.from(await context.agent.keyManagerSign({ keyRef: key2.id, data: options.data as any }))
        },
      },
      key: key2,
      /**
       * A key id URL to the paired public key used for verifying the proof
       */
      verificationMethod: verificationMethodId,
    }
    this.addMethodToBbsBlsSignature2020()
    return new MattrBbsBlsSignature2020(options2)
  }

  private addMethodToBbsBlsSignature2020() {
    function _includesContext(args: { document: any; contextUrl: string }) {
      const context = args.document['@context']
      return context === args.contextUrl || (Array.isArray(context) && context.includes(args.contextUrl))
    }
    //@ts-ignore
    MattrBbsBlsSignature2020.prototype['ensureSuiteContext'] = function (args: { document: any; addSuiteContext: boolean }): void {
      const contextUrl = 'https://w3id.org/security/bbs/v1'
      const document = args.document

      if (_includesContext({ document, contextUrl })) {
        return
      }

      if (!args.addSuiteContext) {
        throw new TypeError(`The document to be signed must contain this suite's @context, ` + `"${contextUrl}".`)
      }
      //@ts-ignore
      const existingContext = document['@context'] || []
      //@ts-ignore
      document['@context'] = Array.isArray(existingContext) ? [...existingContext, contextUrl] : [existingContext, contextUrl]
    }
  }

  preVerificationCredModification(credential: VerifiableCredential): void {
    const vcJson = JSON.stringify(credential)
    if (vcJson.indexOf('BbsBlsSignature2020') > -1) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
      }
    }
  }

  getSuiteForVerification(): any {
    return new MattrBbsBlsSignature2020()
  }

  // preSigningCredModification(_credential: CredentialPayload): void {}
  preSigningCredModification(): void {}

  // preDidResolutionModification(_didUrl: string, _didDoc: DIDDocument): void {
  preDidResolutionModification(): void {
    // nothing to do here
  }
}
