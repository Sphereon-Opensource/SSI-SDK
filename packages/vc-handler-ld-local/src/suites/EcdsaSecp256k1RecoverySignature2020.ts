import { CredentialPayload, DIDDocument, IAgentContext, IKey, TKeyType } from '@veramo/core'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import ldsEcdsa from '@veramo-community/lds-ecdsa-secp256k1-recovery2020'
import * as u8a from 'uint8arrays'
const { EcdsaSecp256k1RecoveryMethod2020, EcdsaSecp256k1RecoverySignature2020 } = ldsEcdsa

import { RequiredAgentMethods, SphereonLdSignature } from '../ld-suites'

export class SphereonEcdsaSecp256k1RecoverySignature2020 extends SphereonLdSignature {
  getSupportedVerificationType(): string {
    return 'EcdsaSecp256k1RecoveryMethod2020'
  }

  getSupportedVeramoKeyType(): TKeyType {
    return 'Secp256k1'
  }

  getSuiteForSigning(key: IKey, did: string, verifiableMethodId: string, context: IAgentContext<RequiredAgentMethods>): any {
    const controller = did
    const signer = {
      //returns a JWS detached
      sign: async (args: { data: Uint8Array }): Promise<string> => {
        const header = {
          alg: 'ES256K-R',
          b64: false,
          crit: ['b64'],
        }
        const headerString = encodeJoseBlob(header)
        const messageBuffer = u8a.concat([u8a.fromString(`${headerString}.`, 'utf-8'), args.data])
        const signature = await context.agent.keyManagerSign({
          keyRef: key.kid,
          algorithm: 'ES256K-R',
          data: messageBuffer,
          encoding: 'base64',
        })
        return `${headerString}..${signature}`
      },
    }

    const suite = new EcdsaSecp256k1RecoverySignature2020({
      // signer,
      key: new EcdsaSecp256k1RecoveryMethod2020({
        publicKeyHex: key.publicKeyHex,
        signer: () => signer,
        type: this.getSupportedVerificationType(),
        controller,
        id: verifiableMethodId,
      }),
    })

    suite.ensureSuiteContext = ({ document }: { document: any; addSuiteContext: boolean }) => {
      document['@context'] = [...asArray(document['@context'] || []), this.getContext()]
    }

    return suite
  }

  getSuiteForVerification(): any {
    return new EcdsaSecp256k1RecoverySignature2020()
  }

  preVerificationCredModification(): void {}

  preSigningCredModification(credential: CredentialPayload): void {
    credential['@context'] = [
      ...asArray(credential['@context'] || []),
      'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
    ]
  }

  preDidResolutionModification(didUrl: string, didDoc: DIDDocument): void {
    const idx =
      didDoc['@context']?.indexOf('https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld') || -1
    if (Array.isArray(didDoc['@context']) && idx !== -1) {
      didDoc['@context'][idx] = this.getContext()
    }
    // did:ethr
    if (didUrl.toLowerCase().startsWith('did:ethr')) {
      // TODO: EcdsaSecp256k1RecoveryMethod2020 does not support blockchainAccountId
      // blockchainAccountId to ethereumAddress
      didDoc.verificationMethod?.forEach((x) => {
        if (x.blockchainAccountId) {
          x.ethereumAddress = x.blockchainAccountId.substring(0, x.blockchainAccountId.lastIndexOf('@'))
        }
      })
    }
  }

  getContext(): string {
    return 'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
  }
}
