// import { Bls12381G2KeyPair } from '@mattrglobal/jsonld-signatures-bbs'
import { IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray } from '@veramo/utils'
import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'
import { KeyType } from '@sphereon/ssi-sdk-bls-kms-local'
import { BbsBlsSignature2020 as TMBbsBlsSignature2020 } from '@transmute/bbs-bls12381-signature-2020'
import * as u8a from 'uint8arrays'
import { hexToMultibase, MultibaseFormat } from '@sphereon/ssi-sdk-core'


const blsModule = require('@transmute/bls12381-key-pair')
// const Bls12381G2Key2020 = require('@transmute/bls12381-key-pair')
// const fromBls12381G2Key2020 = require('@transmute/bls12381-key-pair')

export enum VerificationType {
  Bls12381G2Key2020 = 'Bls12381G2Key2020',
}

export class BbsBlsSignature2020 extends SphereonLdSignature {
  constructor() {
    super()
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
    /*const blsKey : Bls12381G2Key2020 = {
      id: id,
      controller: controller,
      privateKeyBase58: hexToMultibase(key.privateKeyHex, MultibaseFormat.BASE58).value.substring(1),
      publicKeyBase58: hexToMultibase(key.publicKeyHex, MultibaseFormat.BASE58).value.substring(1),
      type: 'Bls12381G2Key2020',
    }*/
    const privateKeyBase58 = hexToMultibase(key.privateKeyHex, MultibaseFormat.BASE58).value.substring(1)
    const publicKeyBase58 =  hexToMultibase(key.publicKeyHex, MultibaseFormat.BASE58).value.substring(1)
    // const { publicKey, privateKey } = fromBls12381G2Key2020(blsKey)
    const keyPairOptions = {
      id: id,
      controller: controller,
      publicKey: u8a.fromString(publicKeyBase58),
      privateKey: u8a.fromString(privateKeyBase58),
      type: 'Bls12381G2Key2020',
    }
    const bls12381G2KeyPair = new blsModule.Bls12381G2KeyPair(keyPairOptions)
    return new TMBbsBlsSignature2020({key: bls12381G2KeyPair})
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
    return new TMBbsBlsSignature2020()
  }

  // preSigningCredModification(_credential: CredentialPayload): void {}
  preSigningCredModification(): void {}

  // preDidResolutionModification(_didUrl: string, _didDoc: DIDDocument): void {
  preDidResolutionModification(): void {
    // nothing to do here
  }
}/*
export const fromBls12381G2Key2020 = (
  k: Bls12381G2Key2020
): { publicKey: Uint8Array; privateKey?: Uint8Array } => {
  const publicKey = base58.decode(k.publicKeyBase58);
  let privateKey = undefined;
  if (k.privateKeyBase58) {
    privateKey = Uint8Array.from(base58.decode(k.privateKeyBase58));
  }
  return { publicKey, privateKey };
};
*/
