import type { IAgentPlugin, IIdentifier, IVerifyResult, VerifiableCredential, VerifiablePresentation } from '@veramo/core'
import { schema } from '@veramo/core'

import type {
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IVcdmCredentialPlugin,
  IVcdmCredentialProvider,
  IVcdmIssuerAgentContext,
  IVcdmVerifierAgentContext,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
} from './types'

import { isDefined, MANDATORY_CREDENTIAL_CONTEXT, processEntryToArray } from '@veramo/utils'
import Debug from 'debug'
import { extractIssuer, isRevoked } from './functions'
import type { W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'
import type { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'

const debug = Debug('sphereon:ssi-sdk:vcdm')

/**
 * A plugin that implements the {@link @sphereon/ssi-sdk.credential-vcdm#IVcdmCredentialPlugin} methods.
 *
 * @public
 */
export class VcdmCredentialPlugin implements IAgentPlugin {
  readonly methods: IVcdmCredentialPlugin
  readonly schema = {
    components: {
      schemas: {
        ...schema.ICredentialIssuer.components.schemas,
        ...schema.ICredentialVerifier.components.schemas,
      },
      methods: {
        ...schema.ICredentialIssuer.components.methods,
        ...schema.ICredentialVerifier.components.methods,
      },
    },
  }
  private issuers: IVcdmCredentialProvider[]

  constructor(options: { issuers: IVcdmCredentialProvider[] }) {
    this.issuers = options.issuers
    this.methods = {
      listUsableProofFormats: this.listUsableProofFormats.bind(this),
      createVerifiableCredential: this.createVerifiableCredential.bind(this),
      verifyCredential: this.verifyCredential.bind(this),
      createVerifiablePresentation: this.createVerifiablePresentation.bind(this),
      verifyPresentation: this.verifyPresentation.bind(this),
    }
  }

  async listUsableProofFormats(did: IIdentifier, context: IVcdmIssuerAgentContext): Promise<string[]> {
    const signingOptions: string[] = []
    const keys = did.keys
    for (const key of keys) {
      for (const issuer of this.issuers) {
        if (issuer.matchKeyForType(key)) {
          signingOptions.push(issuer.getTypeProofFormat())
        }
      }
    }
    return signingOptions
  }

  /** {@inheritdoc @veramo/core#ICredentialIssuer.createVerifiableCredential} */
  async createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP> {
    let { credential, proofFormat, /* keyRef, removeOriginalFields,*/ now /*, ...otherOptions */ } = args
    const credentialContext = processEntryToArray(credential['@context'], MANDATORY_CREDENTIAL_CONTEXT)
    const credentialType = processEntryToArray(credential.type, 'VerifiableCredential')

    // only add issuanceDate for JWT
    now = typeof now === 'number' ? new Date(now * 1000) : now
    if (!Object.getOwnPropertyNames(credential).includes('issuanceDate')) {
      credential.issuanceDate = (now instanceof Date ? now : new Date()).toISOString()
    }

    credential = {
      ...credential,
      '@context': credentialContext,
      type: credentialType,
    }

    //FIXME: if the identifier is not found, the error message should reflect that.
    const issuer = extractIssuer(credential, { removeParameters: true })
    if (!issuer || typeof issuer === 'undefined') {
      throw new Error('invalid_argument: credential.issuer must not be empty')
    }

    try {
      await context.agent.didManagerGet({ did: issuer })
    } catch (e) {
      throw new Error(`invalid_argument: credential.issuer must be a DID managed by this agent. ${e}`)
    }
    try {
      async function findAndIssueCredential(issuers: IVcdmCredentialProvider[]) {
        for (const issuer of issuers) {
          if (issuer.canIssueCredentialType({ proofFormat })) {
            return await issuer.createVerifiableCredential(args, context)
          }
        }
        throw new Error('invalid_setup: No issuer found for the requested proof format')
      }
      const verifiableCredential = await findAndIssueCredential(this.issuers)
      return verifiableCredential
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  /** {@inheritdoc @veramo/core#ICredentialVerifier.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult> {
    let { credential, policies /*, ...otherOptions*/ } = args
    let verifiedCredential: VerifiableCredential
    let verificationResult: IVerifyResult | undefined = { verified: false }

    async function findAndVerifyCredential(issuers: IVcdmCredentialProvider[]): Promise<IVerifyResult> {
      for (const issuer of issuers) {
        if (issuer.canVerifyDocumentType({ document: credential as W3CVerifiableCredential })) {
          return issuer.verifyCredential(args, context)
        }
      }
      return Promise.reject(Error('invalid_setup: No issuer found for the provided credential'))
    }
    verificationResult = await findAndVerifyCredential(this.issuers)
    verifiedCredential = <VerifiableCredential>credential

    if (policies?.credentialStatus !== false && (await isRevoked(verifiedCredential, context as any))) {
      verificationResult = {
        verified: false,
        error: {
          message: 'revoked: The credential was revoked by the issuer',
          errorCode: 'revoked',
        },
      }
    }

    return verificationResult
  }

  /** {@inheritdoc @veramo/core#ICredentialIssuer.createVerifiablePresentation} */
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    let {
      presentation,
      proofFormat,
      /*      domain,
      challenge,
      removeOriginalFields,
      keyRef,*/
      // save,
      /*now,*/
      /*...otherOptions*/
    } = args
    const presentationContext: string[] = processEntryToArray(args?.presentation?.['@context'], MANDATORY_CREDENTIAL_CONTEXT)
    const presentationType = processEntryToArray(args?.presentation?.type, 'VerifiablePresentation')
    presentation = {
      ...presentation,
      '@context': presentationContext,
      type: presentationType,
    }

    if (!isDefined(presentation.holder)) {
      throw new Error('invalid_argument: presentation.holder must not be empty')
    }

    if (presentation.verifiableCredential) {
      presentation.verifiableCredential = presentation.verifiableCredential.map((cred) => {
        // map JWT credentials to their canonical form
        if (typeof cred !== 'string' && cred.proof.jwt) {
          return cred.proof.jwt
        } else {
          return cred
        }
      })
    }

    let verifiablePresentation: VerifiablePresentation | undefined

    async function findAndCreatePresentation(issuers: IVcdmCredentialProvider[]) {
      for (const issuer of issuers) {
        if (issuer.canIssueCredentialType({ proofFormat })) {
          return await issuer.createVerifiablePresentation(args, context)
        }
      }
      throw new Error('invalid_setup: No issuer found for the requested proof format')
    }

    verifiablePresentation = await findAndCreatePresentation(this.issuers)
    return verifiablePresentation as VerifiablePresentationSP // fixme: this is a hack to get around the fact that the return type is not correct.
  }

  /** {@inheritdoc @veramo/core#ICredentialVerifier.verifyPresentation} */
  async verifyPresentation(args: IVerifyPresentationLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult> {
    let { presentation /*domain, challenge, fetchRemoteContexts, policies, ...otherOptions*/ } = args
    async function findAndVerifyPresentation(issuers: IVcdmCredentialProvider[]): Promise<IVerifyResult> {
      for (const issuer of issuers) {
        if (issuer.canVerifyDocumentType({ document: presentation as W3CVerifiablePresentation })) {
          return issuer.verifyPresentation(args, context)
        }
      }
      throw new Error('invalid_setup: No verifier found for the provided presentation')
    }
    const result = await findAndVerifyPresentation(this.issuers)
    return result
  }
}
