import { blsSign } from '@mattrglobal/node-bbs-signatures'
import { Bls12381G2KeyPair, BbsBlsSignature2020 as MattrBbsBlsSignature2020 } from '@mattrglobal/jsonld-signatures-bbs'
import { IKey, TKeyType as VeramoTKeyType, VerifiableCredential } from '@veramo/core'
import { asArray } from '@veramo/utils'
import suiteContext2020 from 'ed25519-signature-2020-context'
import * as u8a from 'uint8arrays'

import { SphereonLdSignature } from '../ld-suites'

export type TKeyType = VeramoTKeyType | 'Bls12381G2'

export class SphereonBbsBlsSignature2020 extends SphereonLdSignature {
  constructor() {
    super()
    // Ensure it is loaded
    suiteContext2020?.constants
  }

  getSupportedVerificationType(): string {
    return 'Bls12381G2Key2020'
  }

  getSupportedVeramoKeyType(): TKeyType {
    return 'Bls12381G2'
  }

  getContext(): string {
    return 'https://w3id.org/security/bbs/v1'
  }

  getSuiteForSigning(key: IKey, issuerDid: string, verificationMethodId: string): any {
    const controller = issuerDid

    // DID Key ID
    const id = verificationMethodId
    const signer = {
      sign: async (args: { data: Uint8Array }): Promise<Uint8Array> => {
        if (!key.privateKeyHex) {
          throw new Error('privateKey not found!')
        }
        const keyPair = {
          publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
          secretKey: new Uint8Array(Buffer.from(key.privateKeyHex as string)),
        }
        const signature = await blsSign({
          keyPair,
          messages: [args.data],
        })
        return u8a.fromString(`${signature}`)
      },
    }

    const options = {
      id: id,
      controller: controller,
      privateKeyBase58: key.privateKeyHex as string,
      publicKeyBase58: key.publicKeyHex,
      signer: () => signer,
      type: this.getSupportedVerificationType(),
    }
    /*const key1 = new Bls12381G2KeyPair({
      publicKeyBase58: hexToMultibase("", MultibaseFormat.BASE58).value
    });
    const bbsSignature = new BbsBlsSignature2020({
      key1
    })*/
    let key2: Bls12381G2KeyPair = undefined as unknown as Bls12381G2KeyPair
    Promise.resolve(Bls12381G2KeyPair.from(options)).then((keyPair) => {
      key2 = keyPair as Bls12381G2KeyPair
    })
    // createBls12381G2KeyPairFromOptions(options)
    const options2 = {
      //signer: KeyPairSigner;
      key: key2,
      /**
       * A key id URL to the paired public key used for verifying the proof
       */
      // readonly verificationMethod?: string;
      /**
       * The `created` date to report in generated proofs
       */
      // readonly date?: string | Date;
      /**
       * Indicates whether to use the native implementation
       * of RDF Dataset Normalization
       */
      // useNativeCanonize: boolean;
      /**
       * Additional proof elements
       */
      // readonly proof?: any;
      /**
       * Linked Data Key class implementation
       */
      // readonly LDKeyClass?: any;
    }
    // verificationKey.type = this.getSupportedVerificationType()

    return new MattrBbsBlsSignature2020(options2)
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
