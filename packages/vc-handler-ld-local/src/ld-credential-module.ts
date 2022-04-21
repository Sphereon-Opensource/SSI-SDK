import { purposes } from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { blsCreateProof, blsSign, blsVerifyProof } from '@mattrglobal/bbs-signatures'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import {
  CredentialPayload,
  IAgentContext,
  IKey,
  IKeyManager,
  IResolver,
  PresentationPayload,
  ProofType,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdDocumentLoader } from './ld-document-loader'
import { LdSuiteLoader } from './ld-suite-loader'

export type RequiredAgentMethods = IResolver & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>

const ProofPurpose = purposes.ProofPurpose
const AssertionProofPurpose = purposes.AssertionProofPurpose
const AuthenticationProofPurpose = purposes.AuthenticationProofPurpose

const debug = Debug('sphereon:ssi-sdk:ld-credential-module-local')

export class LdCredentialModule {
  /**
   * TODO: General Implementation Notes
   * - (SOLVED) EcdsaSecp256k1Signature2019 (Signature) and EcdsaSecp256k1VerificationKey2019 (Key)
   * are not useable right now, since they are not able to work with blockChainId and ECRecover.
   * - DID Fragment Resolution.
   * - Key Manager and Verification Methods: Veramo currently implements no link between those.
   */

  ldSuiteLoader: LdSuiteLoader
  private ldDocumentLoader: LdDocumentLoader

  constructor(options: { ldContextLoader: LdContextLoader; ldSuiteLoader: LdSuiteLoader }) {
    this.ldSuiteLoader = options.ldSuiteLoader
    this.ldDocumentLoader = new LdDocumentLoader(options)
  }

  async issueLDVerifiableCredential(
    credential: CredentialPayload,
    issuerDid: string,
    key: IKey,
    verificationMethodId: string,
    purpose: typeof ProofPurpose = new CredentialIssuancePurpose(),
    context: IAgentContext<RequiredAgentMethods>
  ): Promise<VerifiableCredentialSP> {
    console.log(`Issue VC method called for ${key.kid}...`)
    console.log("CredentialPayload:", credential)
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, true)

    // some suites can modify the incoming credential (e.g. add required contexts)W
    suite.preSigningCredModification(credential)
    debug(`Signing suite will be retrieved for ${verificationMethodId}...`)
    const signingSuite = await suite.getSuiteForSigning(key, issuerDid, verificationMethodId, context)
    debug(`Issuer ${issuerDid} will create VC for ${key.kid}...`)
    if (suite.getSupportedVeramoKeyType() === 'Bls12381G2') {
      const keyPair = {
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        secretKey: new Uint8Array(Buffer.from(key.privateKeyHex as string)),
      }
      const signature = await blsSign({
        keyPair,
        messages: [new Uint8Array(Buffer.from(JSON.stringify(credential) as string))],
      })
      const proofUint8Array: Uint8Array = await this.bbsCreateProof({
        signature,
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        messages: [new Uint8Array(Buffer.from(JSON.stringify(credential) as string))],
        revealed: [0],
        nonce: Uint8Array.from(Buffer.from('nonce', 'utf8')),
      })
      return {
        ...credential,
        proof: JSON.parse(Buffer.from(proofUint8Array.buffer).toString()) as ProofType,
      } as VerifiableCredentialSP
    } else {
      const verifiableCredential = await vc.issue({
        credential,
        purpose,
        suite: signingSuite,
        documentLoader,
        compactProof: false,
      })
      debug(`Issuer ${issuerDid} created VC for ${key.kid}`)
      return verifiableCredential
    }
  }

  async signLDVerifiablePresentation(
    presentation: PresentationPayload,
    holderDid: string,
    key: IKey,
    verificationMethodId: string,
    challenge: string | undefined,
    domain: string | undefined,
    purpose: typeof ProofPurpose = !challenge && !domain
      ? new AssertionProofPurpose()
      : new AuthenticationProofPurpose({
          domain,
          challenge,
        }),
    context: IAgentContext<RequiredAgentMethods>
  ): Promise<VerifiablePresentationSP> {
    console.log("PresentationPayload:", presentation)
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, true)
    suite.preSigningPresModification(presentation)
    if (suite.getSupportedVeramoKeyType() === 'Bls12381G2') {
      const keyPair = {
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        secretKey: new Uint8Array(Buffer.from(key.privateKeyHex as string)),
      }
      const signature = await blsSign({
        keyPair,
        messages: [new Uint8Array(Buffer.from(JSON.stringify(presentation) as string))],
      })
      const proofUint8Array: Uint8Array = await this.bbsCreateProof({
        signature,
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        messages: [new Uint8Array(Buffer.from(JSON.stringify(presentation) as string))],
        revealed: [0],
        nonce: Uint8Array.from(Buffer.from('nonce', 'utf8')),
      })
      return {
        ...presentation,
        proof: { proof: JSON.parse(Buffer.from(proofUint8Array.buffer).toString()) as ProofType },
      } as VerifiablePresentationSP
    } else {
      return await vc.signPresentation({
        presentation,
        suite: suite.getSuiteForSigning(key, holderDid, verificationMethodId, context),
        challenge,
        domain,
        documentLoader,
        purpose,
        compactProof: false,
      })
    }
  }

  async verifyCredential(
    credential: VerifiableCredential,
    context: IAgentContext<IResolver>,
    fetchRemoteContexts = false,
    purpose: typeof ProofPurpose = new AssertionProofPurpose(),
    key?: IKey, // used only for bbs+ verification
    checkStatus?: Function
  ): Promise<boolean> {
    const verificationSuites = this.getAllVerificationSuites()
    this.ldSuiteLoader.getAllSignatureSuites().forEach((suite) => suite.preVerificationCredModification(credential))

    if (credential.proof.type === 'BbsBlsSignature2020') {
      if (!key) {
        throw new Error('You need to pass key (public) to be able to call this operation for bbs+ signature.')
      }
      return await this.bbsBlsVerifyProof({
        proof: new Uint8Array(Buffer.from(JSON.stringify(credential.proof) as string)),
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        messages: [new Uint8Array(Buffer.from(JSON.stringify(credential) as string))],
        nonce: Uint8Array.from(Buffer.from('nonce', 'utf8')),
      })
    } else {
      const result = await vc.verifyCredential({
        credential,
        suite: verificationSuites,
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
        purpose: purpose,
        compactProof: false,
        checkStatus: checkStatus,
      })
      console.log(JSON.stringify(result, null, 2))
      if (result.verified) return true

      // NOT verified.

      // result can include raw Error
      debug(`Error verifying LD Verifiable Credential: ${JSON.stringify(result, null, 2)}`)
      throw Error('Error verifying LD Verifiable Credential')
    }
  }

  async verifyPresentation(
    presentation: VerifiablePresentation,
    challenge: string | undefined,
    domain: string | undefined,
    context: IAgentContext<IResolver>,
    fetchRemoteContexts = false,
    presentationPurpose: typeof ProofPurpose = !challenge && !domain
      ? new AssertionProofPurpose()
      : new AuthenticationProofPurpose(domain, challenge),
    key?: IKey, // used only for bbs+ verification
    checkStatus?: Function
  ): Promise<boolean> {
    if (presentation.proof.type === 'BbsBlsSignature2020') {
      if (!key) {
        throw new Error('You need to pass key (public) to be able to call this operation for bbs+ signature.')
      }
      return await this.bbsBlsVerifyProof({
        proof: new Uint8Array(Buffer.from(JSON.stringify(presentation.proof) as string)),
        publicKey: new Uint8Array(Buffer.from(key.publicKeyHex)),
        messages: [new Uint8Array(Buffer.from(JSON.stringify(presentation) as string))],
        nonce: Uint8Array.from(Buffer.from('nonce', 'utf8')),
      })
    } else {
      const result = await vc.verify({
        presentation,
        suite: this.getAllVerificationSuites(),
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
        challenge,
        domain,
        presentationPurpose,
        compactProof: false,
        checkStatus,
      })

      if (result.verified) return true

      // NOT verified.

      // result can include raw Error
      console.log(`Error verifying LD Verifiable Presentation`)
      console.log(JSON.stringify(result, null, 2))
      throw Error('Error verifying LD Verifiable Presentation')
    }
  }

  async bbsCreateProof(req: {
    /**
     * BBS signature to generate the BBS proof from
     */
    readonly signature: Uint8Array;
    /**
     * Public key of the original signer of the signature
     */
    readonly publicKey: Uint8Array;
    /**
     * The messages that were originally signed
     */
    readonly messages: readonly Uint8Array[];
    /**
     * The zero based indicies of which messages to reveal
     */
    readonly revealed: readonly number[];
    /**
     * A nonce for the resulting proof
     */
    readonly nonce: Uint8Array;
  }): Promise<Uint8Array> {
    return await blsCreateProof({
      signature: req.signature,
      publicKey: req.publicKey,
      messages: req.messages,
      nonce: req.nonce,
      revealed: req.revealed,
    })
  }

  async bbsBlsVerifyProof(req: {
    /**
     * The BBS proof to verify
     */
    readonly proof: Uint8Array;
    /**
     * Public key of the signer of the proof to verify
     */
    readonly publicKey: Uint8Array;
    /**
     * Revealed messages to verify (TODO maybe rename this field??)
     */
    readonly messages: readonly Uint8Array[];
    /**
     * Nonce included in the proof for the un-revealed attributes (OPTIONAL)
     */
    readonly nonce: Uint8Array;
  }) {
    const result = await blsVerifyProof({
      proof: req.proof,
      publicKey: req.publicKey,
      messages: req.messages,
      nonce: req.nonce,
    })

    if (result.verified) return true
    debug(`Error verifying message proof: ${JSON.stringify(result, null, 2)}`)
    console.log(JSON.stringify(result, null, 2))
    throw Error('Error verifying message proof')
  }

  private getAllVerificationSuites() {
    return this.ldSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification())
  }
}
