import { asArray, type VerifiableCredentialSP, type VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import {
  CredentialMapper,
  IVerifyResult,
  IVerifySingleResultItem,
  OriginalVerifiableCredential,
  W3CVerifiableCredential,
  W3CVerifiablePresentation,
} from '@sphereon/ssi-types'
import type { IAgentPlugin, IIdentifier, VerifiableCredential } from '@veramo/core'
import { schema } from '@veramo/core'
import Debug from 'debug'
import { isRevoked, preProcessCredentialPayload, preProcessPresentation } from './functions'

import type {
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IVcdmCredentialPlugin,
  IVcdmCredentialProvider,
  IVcdmIssuerAgentContext,
  IVcdmVerifierAgentContext,
  IVerifyCredentialVcdmArgs,
  IVerifyPresentationLDArgs,
} from './types'

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
    let { proofFormat /* keyRef, removeOriginalFields, now , ...otherOptions */ } = args
    const { credential, issuer, now } = preProcessCredentialPayload(args)

    try {
      await context.agent.didManagerGet({ did: issuer })
    } catch (e) {
      throw new Error(`invalid_argument: credential.issuer must be a DID managed by this agent. ${e}`)
    }
    try {
      async function findAndIssueCredential(issuers: IVcdmCredentialProvider[]) {
        for (const issuer of issuers) {
          if (issuer.canIssueCredentialType({ proofFormat })) {
            return await issuer.createVerifiableCredential({ ...args, credential, now }, context)
          }
        }
        throw new Error(
          `invalid_setup: No issuer found for the requested proof format: ${proofFormat}, supported: ${issuers.map((i) => i.getTypeProofFormat()).join(',')}`,
        )
      }

      const verifiableCredential = await findAndIssueCredential(this.issuers)
      return verifiableCredential
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  /** {@inheritdoc @veramo/core#ICredentialVerifier.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialVcdmArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult> {
    let { credential, policies /*, ...otherOptions*/ } = args
    let verifiedCredential: VerifiableCredential
    let verificationResult: IVerifyResult

    async function findAndVerifyCredential(issuers: IVcdmCredentialProvider[]): Promise<IVerifyResult> {
      for (const issuer of issuers) {
        if (issuer.canVerifyDocumentType({ document: credential as W3CVerifiableCredential })) {
          return issuer.verifyCredential(args, context)
        }
      }
      const uniform = CredentialMapper.toUniformCredential(args.credential as OriginalVerifiableCredential)
      return Promise.reject(
        Error(
          `invalid_setup: No verifier found for the provided credential credential
           type: ${JSON.stringify(uniform.type)} proof type 
           ${asArray(uniform.proof)?.[0]?.type} supported: ${issuers.map((i) => i.getTypeProofFormat()).join(',')}`,
        ),
      )
    }

    verificationResult = await findAndVerifyCredential(this.issuers)
    verifiedCredential = <VerifiableCredential>credential

    if (policies?.credentialStatus !== false && (await isRevoked(verifiedCredential, context as any))) {
      const results = verificationResult.results
      const partialSingleResult: Partial<IVerifySingleResultItem> = Array.isArray(results)
        ? results[0]
        : {
            credential: credential as OriginalVerifiableCredential,
            verified: false,
            log: [],
          }
      const result: IVerifySingleResultItem = {
        ...partialSingleResult,
        credential: credential as OriginalVerifiableCredential,
        verified: false,
        error: {
          message: 'revoked: The credential was revoked by the issuer',
          errorCode: 'revoked',
        },
        log: [...(partialSingleResult.log ?? []), { id: 'revocation_status', valid: false }],
      }
      verificationResult = {
        ...verificationResult,
        verified: false,
        error: result.error,
        results: [result],
      }
    }

    return verificationResult
  }

  /** {@inheritdoc @veramo/core#ICredentialIssuer.createVerifiablePresentation} */
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    const { proofFormat } = args
    const { presentation } = preProcessPresentation(args)

    let verifiablePresentation: VerifiablePresentationSP

    async function findAndCreatePresentation(issuers: IVcdmCredentialProvider[]) {
      for (const issuer of issuers) {
        if (issuer.canIssueCredentialType({ proofFormat })) {
          return await issuer.createVerifiablePresentation({ ...args, presentation }, context)
        }
      }
      throw new Error(
        `invalid_setup: No issuer found for the requested proof format: ${proofFormat}, supported: ${issuers.map((i) => i.getTypeProofFormat()).join(',')}`,
      )
    }

    verifiablePresentation = await findAndCreatePresentation(this.issuers)
    return verifiablePresentation
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
