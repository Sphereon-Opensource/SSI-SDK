import { purposes } from '@digitalcredentials/jsonld-signatures'
import * as vc from '@digitalcredentials/vc'
import { CredentialIssuancePurpose } from '@digitalcredentials/vc'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { IStatusListEntryEntity } from '@sphereon/ssi-sdk.data-store'
import { getDriver } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { IVerifyResult, StatusListCredentialIdMode } from '@sphereon/ssi-types'
import { CredentialPayload, IAgentContext, IKey, PresentationPayload, VerifiableCredential, VerifiablePresentation } from '@veramo/core'
import Debug from 'debug'

import { LdContextLoader } from './ld-context-loader'
import { LdDocumentLoader } from './ld-document-loader'
import { LdSuiteLoader } from './ld-suite-loader'
import { RequiredAgentMethods } from './ld-suites'
import { events, IIssueCredentialStatusOpts } from './types'

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
    await this.handleCredentialStatus(credential, args.credentialStatusOpts)

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

  private async handleCredentialStatus(credential: CredentialPayload, credentialStatusOpts?: IIssueCredentialStatusOpts) {
    if (credential.credentialStatus) {
      const credentialId = credential.id ?? credentialStatusOpts?.credentialId
      const statusListId = credential.credentialStatus.statusListCredential ?? credentialStatusOpts?.statusListId
      debug(`Creating new credentialStatus object for credential with id ${credentialId} and statusListId ${statusListId}...`)
      if (!statusListId) {
        throw Error(
          `A credential status is requested, but we could not determine the status list id from 'statusListCredential' value or configuration`,
        )
      }

      // fixme: We really should make the status-list an agent plugin and pass the DataSource in the agent setup phase.
      // This will not work when not setup with the DataSources class.
      let dbName = credentialStatusOpts?.dbName
      if (!dbName) {
        const dbNames = DataSources.singleInstance().getDbNames()
        if (!dbNames || dbNames.length === 0) {
          throw Error(`Please use the DataSources class to register DB connections. The status list support needs a DB connection at this point`)
        }
        dbName = dbNames[0]
      }
      const slDriver = await getDriver({ id: statusListId, dbName })
      const statusList = await slDriver.statusListStore.getStatusList({ id: statusListId })

      if (!credentialId && statusList.credentialIdMode === StatusListCredentialIdMode.ISSUANCE) {
        throw Error(
          'No credential.id was provided in the credential, whilst the issuer is configured to persist credentialIds. Please adjust your input credential to contain an id',
        )
      }
      let existingEntry: IStatusListEntryEntity | undefined = undefined
      if (credentialId) {
        existingEntry = await slDriver.getStatusListEntryByCredentialId({
          statusListId: statusList.id,
          credentialId,
          errorOnNotFound: false,
        })
        debug(
          `Existing statusList entry and index ${existingEntry?.statusListIndex} found for credential with id ${credentialId} and statusListId ${statusListId}. Will reuse the index`,
        )
      }
      let statusListIndex = existingEntry?.statusListIndex ?? credential.credentialStatus.statusListIndex ?? credentialStatusOpts?.credentialId
      if (statusListIndex) {
        existingEntry = await slDriver.getStatusListEntryByIndex({
          statusListId: statusList.id,
          statusListIndex,
          errorOnNotFound: false,
        })
        debug(
          `${!existingEntry && 'no'} existing statusList entry and index ${
            existingEntry?.statusListIndex
          } for credential with id ${credentialId} and statusListId ${statusListId}. Will reuse the index`,
        )
        if (existingEntry && credentialId && existingEntry.credentialId && existingEntry.credentialId !== credentialId) {
          throw Error(
            `A credential with new id (${credentialId}) is issued, but its id does not match a registered statusListEntry id ${existingEntry.credentialId} for index ${statusListIndex} `,
          )
        }
      } else {
        debug(
          `Will generate a new random statusListIndex since the credential did not contain a statusListIndex for credential with id ${credentialId} and statusListId ${statusListId}...`,
        )
        statusListIndex = await slDriver.getRandomNewStatusListIndex({ correlationId: statusList.correlationId })
        debug(`Random statusListIndex ${statusListIndex} assigned for credential with id ${credentialId} and statusListId ${statusListId}`)
      }
      const result = await slDriver.updateStatusListEntry({
        statusList: statusListId,
        credentialId,
        statusListIndex,
        correlationId: credentialStatusOpts?.statusEntryCorrelationId,
        value: credentialStatusOpts?.value,
      })
      debug(`StatusListEntry with statusListIndex ${statusListIndex} created for credential with id ${credentialId} and statusListId ${statusListId}`)

      credential.credentialStatus = {
        ...credential.credentialStatus,
        ...result.credentialStatus,
      }
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
