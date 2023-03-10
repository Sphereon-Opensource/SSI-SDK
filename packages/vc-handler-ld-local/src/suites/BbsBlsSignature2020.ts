// import { Bls12381G2KeyPair } from '@mattrglobal/jsonld-signatures-bbs'
import { IAgentContext, IKey, TKeyType, VerifiableCredential } from '@veramo/core'
import { asArray } from '@veramo/utils'
import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'
import { KeyType } from '@sphereon/bls-kms-local'
import { BbsBlsSignature2020 as TMBbsBlsSignature2020 } from '@transmute/bbs-bls12381-signature-2020'

import * as u8a from 'uint8arrays'

import { Bls12381G2KeyPair } from '@transmute/bls12381-key-pair'
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
    // const id = verificationMethodId


    if (!key.privateKeyHex) {
      throw new Error('Private key must be defined')
    }

    const privateKey = u8a.fromString(key.privateKeyHex, 'hex')
    const publicKey = u8a.fromString(key.publicKeyHex ?? key.kid, 'hex') // BLS uses the publickey as kid for now
    const keyPairOptions = {
      id: verificationMethodId,
      controller: issuerDid,
      publicKey,
      privateKey,
      type: 'Bls12381G2Key2020',
    }
    const bls12381G2KeyPair = new Bls12381G2KeyPair(keyPairOptions)
    return new TMBbsBlsSignature2020({ key: bls12381G2KeyPair })

  }

  preVerificationCredModification(credential: VerifiableCredential): void {
    const vcJson = JSON.stringify(credential)
    if (vcJson.indexOf('BbsBlsSignature2020') > -1) {
      if (vcJson.indexOf(this.getContext()) === -1) {
        credential['@context'] = [...asArray(credential['@context'] || []), this.getContext()]
      }
    }
  }

  async getSuiteForVerification(opts?: { type: string, verificationMethod: string }): Promise<any> {
    const type = opts?.type
    const verificationMethod = opts?.verificationMethod

    if (type === 'BbsBlsSignature2020' && verificationMethod && verificationMethod.startsWith('did:key:zU')) {
      const key = await Bls12381G2KeyPair.fromFingerprint({ fingerprint: verificationMethod.replace('did:key:', '').split('#')[0] })
      return new TMBbsBlsSignature2020({ key })
    }

    // Probably will fail
    return new TMBbsBlsSignature2020()
  }

  // preSigningCredModification(_credential: CredentialPayload): void {}
  preSigningCredModification(): void {
  }

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
