import { purposes } from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { BbsBlsSignature2020 } from '@mattrglobal/jsonld-signatures-bbs'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import {
  CredentialPayload,
  IAgentContext,
  IKey,
  IKeyManager,
  IResolver,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdDocumentLoader } from './ld-document-loader'
import { LdSuiteLoader } from './ld-suite-loader'

//Support for Typescript added in version 9.0.0
const jsonld = require('jsonld-signatures')

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
    debug(`Issue VC method called for ${key.kid}...`)
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, true)

    // some suites can modify the incoming credential (e.g. add required contexts)
    suite.preSigningCredModification(credential)
    debug(`Signing suite will be retrieved for ${verificationMethodId}...`)
    const signingSuite = await suite.getSuiteForSigning(key, issuerDid, verificationMethodId, context)
    debug(`Issuer ${issuerDid} will create VC for ${key.kid}...`)

    let verifiableCredential
    //Needs to be signed using jsonld-signaures@5.0.1
    if (key.type === 'Bls12381G2') {
      verifiableCredential = await jsonld.sign(credential, {
        suite: signingSuite,
        purpose,
        documentLoader,
      })
    } else {
      verifiableCredential = await vc.issue({
        credential,
        purpose,
        suite: signingSuite,
        documentLoader,
        compactProof: false,
      })
    }
    debug(`Issuer ${issuerDid} created VC for ${key.kid}`)
    return verifiableCredential
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
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, true)

    suite.preSigningPresModification(presentation)

    if (key.type === 'Bls12381G2') {
      return await jsonld.sign(presentation, {
        suite: suite.getSuiteForSigning(key, holderDid, verificationMethodId, context),
        purpose,
        documentLoader,
      })
    }
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

  async verifyCredential(
    credential: VerifiableCredential,
    context: IAgentContext<IResolver>,
    fetchRemoteContexts = false,
    purpose: typeof ProofPurpose = new AssertionProofPurpose(),
    checkStatus?: Function
  ): Promise<boolean> {
    const verificationSuites = this.getAllVerificationSuites()
    this.ldSuiteLoader.getAllSignatureSuites().forEach((suite) => suite.preVerificationCredModification(credential))
    let result
    if (credential.proof.type === 'BbsBlsSignature2020') {
      //Should never be null or undefined
      const suite = this.ldSuiteLoader
        .getAllSignatureSuites()
        .find((s) => s.getSupportedVeramoKeyType() === 'Bls12381G2')
        ?.getSuiteForVerification() as BbsBlsSignature2020
      result = await jsonld.verify(credential, {
        suite,
        purpose: purpose,
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
      })
    } else {
      result = await vc.verifyCredential({
        credential,
        suite: verificationSuites,
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
        purpose: purpose,
        compactProof: false,
        checkStatus: checkStatus,
      })
    }
    if (result.verified) return true

    // NOT verified.

    // result can include raw Error
    debug(`Error verifying LD Verifiable Credential: ${JSON.stringify(result, null, 2)}`)
    console.log(JSON.stringify(result, null, 2))
    throw Error('Error verifying LD Verifiable Credential')
  }

  private getAllVerificationSuites() {
    return this.ldSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification())
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
    checkStatus?: Function
    //AssertionProofPurpose()
  ): Promise<boolean> {
    // console.log(JSON.stringify(presentation, null, 2))
    let result
    if (presentation.proof.type === 'BbsBlsSignature2020') {
      //Should never be null or undefined
      const suite = this.ldSuiteLoader
        .getAllSignatureSuites()
        .find((s) => s.getSupportedVeramoKeyType() === 'Bls12381G2')
        ?.getSuiteForVerification() as BbsBlsSignature2020
      result = await jsonld.verify(presentation, {
        suite,
        purpose: presentationPurpose,
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
      })
    } else {
      result = await vc.verify({
        presentation,
        suite: this.getAllVerificationSuites(),
        documentLoader: this.ldDocumentLoader.getLoader(context, fetchRemoteContexts),
        challenge,
        domain,
        presentationPurpose,
        compactProof: false,
        checkStatus,
      })
    }

    if (result.verified) return true

    // NOT verified.

    // result can include raw Error
    console.log(`Error verifying LD Verifiable Presentation`)
    console.log(JSON.stringify(result, null, 2))
    throw Error('Error verifying LD Verifiable Presentation')
  }
}
