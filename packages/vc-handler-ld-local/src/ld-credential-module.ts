import { purposes } from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { IIssueCredentialStatusOpts, IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { IVerifyResult } from '@sphereon/ssi-types'
import {
  CredentialPayload,
  IAgentContext,
  IKey,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation
} from '@veramo/core'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdDocumentLoader } from './ld-document-loader'
import { LdSuiteLoader } from './ld-suite-loader'
import { RequiredAgentMethods } from './ld-suites'
import { events } from './types'

// import jsigs from '@digitalcredentials/jsonld-signatures'
//Support for Typescript added in version 9.0.0
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsigs = require('jsonld-signatures')

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

  constructor(options: {
    ldContextLoader: LdContextLoader
    ldSuiteLoader: LdSuiteLoader
    documentLoader?: {
      localResolution?: boolean // Resolve identifiers hosted by the agent
      uniresolverResolution?: boolean // Resolve identifiers using universal resolver
      resolverResolution?: boolean // Use registered drivers
    }
  }) {
    this.ldSuiteLoader = options.ldSuiteLoader
    this.ldDocumentLoader = new LdDocumentLoader(options)
  }

  async issueLDVerifiableCredential(
    args: {
      credential: CredentialPayload
      issuerDid: string
      key: IKey
      verificationMethodId: string
      purpose: typeof ProofPurpose
      credentialStatusOpts?: IIssueCredentialStatusOpts
    },
    context: IAgentContext<RequiredAgentMethods>,
  ): Promise<VerifiableCredentialSP> {
    const { key, issuerDid, verificationMethodId, credential } = args
    const purpose = args.purpose ?? new CredentialIssuancePurpose()
    debug(`Issue VC method called for ${key.kid}...`)
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, {
      attemptToFetchContexts: true,
      verifiableData: credential,
    })

    // some suites can modify the incoming credential (e.g. add required contexts)
    suite.preSigningCredModification(credential)
    debug(`Signing suite will be retrieved for ${verificationMethodId}...`)
    const signingSuite = await suite.getSuiteForSigning(key, issuerDid, verificationMethodId, context)
    debug(`Issuer ${issuerDid} will create VC for ${key.kid}...`)
    if (contextHasPlugin<RequiredAgentMethods & IStatusListPlugin>(context, 'slAddStatusToCredential')) {
      // Handle status list if enabled
      // We do some additional check to determine whether we will call the below method, as the OID4VCI or W3C-VC API could also have called the method already
      if (credential.credentialStatus && !credential.credentialStatus.statusListCredential) {
        const credentialStatusVC = await context.agent.slAddStatusToCredential({...args.credentialStatusOpts, credential})
        if (credentialStatusVC.credentialStatus) {
          credential.credentialStatus = credentialStatusVC.credentialStatus
        }
      }
    }

    let verifiableCredential
    //Needs to be signed using jsonld-signaures@5.0.1
    if (key.type === 'Bls12381G2') {
      verifiableCredential = await jsigs.sign(credential, {
        suite: signingSuite,
        purpose,
        documentLoader,
        compactProof: true,
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
    context: IAgentContext<RequiredAgentMethods>,
  ): Promise<VerifiablePresentationSP> {
    const suite = this.ldSuiteLoader.getSignatureSuiteForKeyType(key.type, key.meta?.verificationMethod?.type)
    const documentLoader = this.ldDocumentLoader.getLoader(context, {
      attemptToFetchContexts: true,
      verifiableData: presentation,
    })

    suite.preSigningPresModification(presentation)

    if (key.type === 'Bls12381G2') {
      return await jsigs.sign(presentation, {
        suite: await suite.getSuiteForSigning(key, holderDid, verificationMethodId, context),
        purpose,
        documentLoader,
        compactProof: true,
      })
    }
    return await vc.signPresentation({
      presentation,
      suite: await suite.getSuiteForSigning(key, holderDid, verificationMethodId, context),
      challenge,
      domain,
      documentLoader,
      purpose,
      compactProof: false,
    })
  }

  async verifyCredential(
    credential: VerifiableCredential,
    context: IAgentContext<RequiredAgentMethods>,
    fetchRemoteContexts = false,
    purpose: typeof ProofPurpose = new AssertionProofPurpose(),
    checkStatus?: Function,
  ): Promise<IVerifyResult> {
    const verificationSuites = this.getAllVerificationSuites(context)
    this.ldSuiteLoader.getAllSignatureSuites().forEach((suite) => suite.preVerificationCredModification(credential))
    // let result: IVerifyResult
    const documentLoader = this.ldDocumentLoader.getLoader(context, {
      attemptToFetchContexts: fetchRemoteContexts,
      verifiableData: credential,
    })
    /*
    const isBls = credential.proof.type?.includes('BbsBlsSignature2020')
    const suite = isBls
      ? (this.ldSuiteLoader
          .getAllSignatureSuites()
          .find((s) => s.getSupportedVeramoKeyType() === 'Bls12381G2')
          ?.getSuiteForVerification(context) as BbsBlsSignature2020)
      : verificationSuites
    context.agent
    if (isBls) {
      // fixme: check signature of verify method, adjust result if needed
      result = await jsigs.verify(credential, {
        suite,
        purpose,
        documentLoader,
        compactProof: true,
      })
    } else {*/
    const result = await vc.verifyCredential({
      credential,
      suite: verificationSuites,
      documentLoader,
      purpose,
      compactProof: false,
      checkStatus,
    })
    // }
    if (result.verified) {
      void context.agent.emit(events.CREDENTIAL_VERIFIED, { credential, ...result })
    } else {
      // result can include raw Error
      debug(`Error verifying LD Verifiable Credential: ${JSON.stringify(result, null, 2)}`)
      console.log(`ERROR verifying LD VC:\n${JSON.stringify(result, null, 2)}`)
      void context.agent.emit(events.CREDENTIAL_VERIFY_FAILED, { credential, ...result })
    }
    return result
  }

  private getAllVerificationSuites(context: IAgentContext<RequiredAgentMethods>) {
    return this.ldSuiteLoader.getAllSignatureSuites().map((x) => x.getSuiteForVerification(context))
  }

  async verifyPresentation(
    presentation: VerifiablePresentation,
    challenge: string | undefined,
    domain: string | undefined,
    context: IAgentContext<RequiredAgentMethods>,
    fetchRemoteContexts = false,
    presentationPurpose: typeof ProofPurpose = !challenge && !domain
      ? new AssertionProofPurpose()
      : new AuthenticationProofPurpose({ domain, challenge }),
    checkStatus?: Function,
    //AssertionProofPurpose()
  ): Promise<IVerifyResult> {
    /* let result: IVerifyResult
    if (presentation.proof.type?.includes('BbsBlsSignature2020')) {
      //Should never be null or undefined
      const suite = this.ldSuiteLoader
        .getAllSignatureSuites()
        .find((s) => s.getSupportedVeramoKeyType() === 'Bls12381G2')
        ?.getSuiteForVerification(context) as BbsBlsSignature2020
      result = await jsigs.verify(presentation, {
        suite,
        purpose: presentationPurpose,
        documentLoader: this.ldDocumentLoader.getLoader(context, {
          attemptToFetchContexts: fetchRemoteContexts,
          verifiableData: presentation,
        }),
        compactProof: true,
      })
    } else {*/
    const result = await vc.verify({
      presentation,
      suite: this.getAllVerificationSuites(context),
      documentLoader: this.ldDocumentLoader.getLoader(context, {
        attemptToFetchContexts: fetchRemoteContexts,
        verifiableData: presentation,
      }),
      challenge,
      domain,
      presentationPurpose,
      compactProof: false,
      checkStatus,
    })
    // }

    if (result.verified && (!result.presentationResult || result.presentationResult.verified)) {
      context.agent.emit(events.PRESENTATION_VERIFIED, { presentation, ...result })
    } else {
      // NOT verified.
      debug(`Error verifying LD Verifiable Presentation: ${JSON.stringify(result, null, 2)}`)
      context.agent.emit(events.PRESENTATION_VERIFY_FAILED, { presentation, ...result })
    }
    return result
  }
}
