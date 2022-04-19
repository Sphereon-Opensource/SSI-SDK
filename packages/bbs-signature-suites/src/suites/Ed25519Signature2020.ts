import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020'
import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020'
import { MultibaseFormat } from '@sphereon/ssi-sdk-core/dist/utils/encoding'
import { IAgentContext, IKey, TKeyType as VeramoTKeyType, VerifiableCredential } from '@veramo/core'
import { asArray, encodeJoseBlob } from '@veramo/utils'
import suiteContext2020 from 'ed25519-signature-2020-context'
import * as u8a from 'uint8arrays'

import { hexToMultibase } from '@sphereon/ssi-sdk-core'
import { RequiredAgentMethods, SphereonBbsSignature } from '../bbs-suites'
import { CreateProofOptions, SignatureSuiteOptions } from '@mattrglobal/jsonld-signatures-bbs'
import { Bls12381G2KeyPair } from '@mattrglobal/bls12381-key-pair'
import {
  BbsCreateProofRequest,
  BbsSignRequest,
  BbsVerifyProofRequest,
  BbsVerifyResult,
  blsSign,
  createProof,
  verifyProof,
  sign,
} from '@mattrglobal/node-bbs-signatures'

export type TKeyType = VeramoTKeyType | 'Rsa' | 'EcdsaSecp256k1'

export class SphereonEd25519Signature2020 extends SphereonBbsSignature {
  type: string
  proof: any
  LDKeyClass
  signer
  verificationMethod
  proofSignatureKey
  verifier
  date
  useNativeCanonize
  key

  constructor(options: SignatureSuiteOptions) {
    super()
    // Ensure it is loaded
    suiteContext2020?.constants
    const { verificationMethod, signer, key, date, useNativeCanonize, LDKeyClass } = options
    if (verificationMethod !== undefined && typeof verificationMethod !== 'string') {
      throw new TypeError('"verificationMethod" must be a URL string.')
    }
    this.type = 'sec:BbsBlsSignature2020'

    this.proof = {
      '@context': [
        {
          sec: 'https://w3id.org/security#',
          proof: {
            '@id': 'sec:proof',
            '@type': '@id',
            '@container': '@graph',
          },
        },
        'https://w3id.org/security/bbs/v1',
      ],
      type: 'BbsBlsSignature2020',
    }

    this.LDKeyClass = LDKeyClass ?? Bls12381G2KeyPair
    this.signer = signer
    this.verificationMethod = verificationMethod
    this.proofSignatureKey = 'proofValue'
    if (key) {
      if (verificationMethod === undefined) {
        this.verificationMethod = key.id
      }
      this.key = key
      if (typeof key.signer === 'function') {
        this.signer = key.signer()
      }
      if (typeof key.verifier === 'function') {
        this.verifier = key.verifier()
      }
    }
    if (date) {
      this.date = new Date(date)
      if (isNaN(this.date)) {
        throw TypeError(`"date" "${date}" is not a valid date.`)
      }
    }
    this.useNativeCanonize = useNativeCanonize
  }

  getSupportedVerificationType(): string[] {
    return ['RsaVerificationKey2018', 'Ed25519VerificationKey2018', 'EcdsaSecp256k1VerificationKey2019']
  }

  getSupportedVeramoKeyType(): TKeyType[] {
    return ['Rsa', 'EcdsaSecp256k1', 'Ed25519']
  }

  getContext(): string {
    return 'https://w3id.org/security/bbs/v1'
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
      publicKeyMultibase: hexToMultibase(key.publicKeyHex, MultibaseFormat.BASE58).value,
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

  async createProof(request: BbsCreateProofRequest): Promise<Uint8Array> {
    return await createProof(request)
  }

  async verifyProof(request: BbsVerifyProofRequest): Promise<BbsVerifyResult> {
    return await verifyProof(request)
  }

  async sign(request: BbsSignRequest): Promise<Uint8Array> {
    return await sign(request)
  }
}
