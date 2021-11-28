import { CredentialPayload, IAgentContext, IAgentPlugin, IIdentifier, IKey, IResolver, PresentationPayload } from '@veramo/core'

import { schema } from '../index'
import { ICredentialHandlerLDLocal, IRequiredContext } from '../types/ICredentialHandlerLDLocal'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import {
  ContextDoc,
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
  VeramoLdSignature,
} from '@veramo/credential-ld'
import {
  _ExtendedIKey,
  extractIssuer,
  isDefined,
  MANDATORY_CREDENTIAL_CONTEXT,
  mapIdentifierKeysToDoc,
  OrPromise,
  processEntryToArray,
  RecordLike,
} from '@veramo/utils'
import { LdCredentialModule } from '../ld-credential-module'
import { LdContextLoader } from '../ld-context-loader'
import { LdSuiteLoader } from '../ld-suite-loader'
import Debug from 'debug'

const vc = require('@digitalcredentials/vc')

const debug = Debug('veramo:w3c:ld-credential-action-handler-local')

/**
 * {@inheritDoc IVcLocalIssuerJsonLd}
 */
export class CredentialHandlerLDLocal implements IAgentPlugin {
  private ldCredentialModule: LdCredentialModule
  readonly schema = schema.IVcLocalIssuerJsonLd
  readonly methods: ICredentialHandlerLDLocal = {
    createVerifiableCredentialLDLocal: this.createVerifiableCredentialLDLocal.bind(this),
    createVerifiablePresentationLDLocal: this.createVerifiablePresentationLDLocal.bind(this),
    verifyPresentationLDLocal: this.verifyPresentationLDLocal.bind(this),
    verifyCredentialLDLocal: this.verifyCredentialLDLocal.bind(this),
  }

  constructor(options: { contextMaps: RecordLike<OrPromise<ContextDoc>>[]; suites: VeramoLdSignature[] }) {
    this.ldCredentialModule = new LdCredentialModule({
      ldContextLoader: new LdContextLoader({ contextsPaths: options.contextMaps }),
      ldSuiteLoader: new LdSuiteLoader({ veramoLdSignatures: options.suites }),
    })
  }

  /** {@inheritDoc ICredentialIssuerLDLocal.createVerifiableCredentialLDLocal} */
  private async createVerifiableCredentialLDLocal(
    args: ICreateVerifiableCredentialLDArgs,
    context: IRequiredContext
  ): Promise<VerifiableCredentialSP> {
    // Create a deep copy to prevent signature ending up in passed in object
    // const credentialArg = JSON.parse(JSON.stringify(args.credential))
    const credentialContext = processEntryToArray(args?.credential?.['@context'], MANDATORY_CREDENTIAL_CONTEXT)
    const credentialType = processEntryToArray(args?.credential?.type, 'VerifiableCredential')
    let issuanceDate = args?.credential?.issuanceDate || new Date().toISOString()
    if (issuanceDate instanceof Date) {
      issuanceDate = issuanceDate.toISOString()
    }
    const credential: CredentialPayload = {
      ...args?.credential,
      '@context': credentialContext,
      type: credentialType,
      issuanceDate,
    }

    const issuer = extractIssuer(credential)
    if (!issuer || typeof issuer === 'undefined') {
      throw new Error('invalid_argument: args.credential.issuer must not be empty')
    }

    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: issuer })
    } catch (e) {
      throw new Error(`invalid_argument: args.credential.issuer must be a DID managed by this agent. ${e}`)
    }
    try {
      const { signingKey, verificationMethodId } = await this.findSigningKeyWithId(context, identifier, args.keyRef)

      return await this.ldCredentialModule.issueLDVerifiableCredential(credential, identifier.did, signingKey, verificationMethodId, context)
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  /** {@inheritdoc ICredentialIssuerLD.createVerifiablePresentationLD} */
  private async createVerifiablePresentationLDLocal(
    args: ICreateVerifiablePresentationLDArgs,
    context: IRequiredContext
  ): Promise<VerifiablePresentationSP> {
    const presentationContext = processEntryToArray(args?.presentation?.['@context'], MANDATORY_CREDENTIAL_CONTEXT)
    const presentationType = processEntryToArray(args?.presentation?.type, 'VerifiablePresentation')

    const presentation: PresentationPayload = {
      ...args?.presentation,
      '@context': presentationContext,
      type: presentationType,
    }

    if (!isDefined(presentation.holder) || !presentation.holder) {
      throw new Error('invalid_argument: args.presentation.holder must not be empty')
    }

    if (args.presentation.verifiableCredential) {
      const credentials = args.presentation.verifiableCredential.map((cred) => {
        if (typeof cred !== 'string' && cred.proof.jwt) {
          return cred.proof.jwt
        } else {
          return cred
        }
      })
      presentation.verifiableCredential = credentials
    }

    //issuanceDate must not be present for presentations because it is not defined in a @context
    delete presentation.issuanceDate

    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: presentation.holder })
    } catch (e) {
      throw new Error('invalid_argument: args.presentation.holder must be a DID managed by this agent')
    }
    try {
      const { signingKey, verificationMethodId } = await this.findSigningKeyWithId(context, identifier, args.keyRef)

      return await this.ldCredentialModule.signLDVerifiablePresentation(
        presentation,
        identifier.did,
        signingKey,
        verificationMethodId,
        args.challenge,
        args.domain,
        context
      )
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyCredentialLDLocal} */
  public async verifyCredentialLDLocal(args: IVerifyCredentialLDArgs, context: IRequiredContext): Promise<boolean> {
    const credential = args.credential
    return this.ldCredentialModule.verifyCredential(credential, context)
  }

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyPresentationLDLocal} */
  public async verifyPresentationLDLocal(args: IVerifyPresentationLDArgs, context: IRequiredContext): Promise<boolean> {
    const presentation = args.presentation
    return this.ldCredentialModule.verifyPresentation(presentation, args.challenge, args.domain, context)
  }

  private async findSigningKeyWithId(
    context: IAgentContext<IResolver>,
    identifier: IIdentifier,
    keyRef?: string
  ): Promise<{ signingKey: IKey; verificationMethodId: string }> {
    const extendedKeys: _ExtendedIKey[] = await mapIdentifierKeysToDoc(identifier, 'assertionMethod', context)
    let supportedTypes = this.ldCredentialModule.ldSuiteLoader.getAllSignatureSuiteTypes()
    let signingKey: _ExtendedIKey | undefined
    let verificationMethodId: string
    if (keyRef) {
      signingKey = extendedKeys.find((k) => k.kid === keyRef)
    }
    if (signingKey && !supportedTypes.includes(signingKey.meta.verificationMethod.type)) {
      debug('WARNING: requested signing key DOES NOT correspond to a supported Signature suite type. Looking for the next best key.')
      signingKey = undefined
    }
    if (!signingKey) {
      if (keyRef) {
        debug('WARNING: no signing key was found that matches the reference provided. Searching for the first available signing key.')
      }
      signingKey = extendedKeys.find((k) => supportedTypes.includes(k.meta.verificationMethod.type))
    }

    if (!signingKey) throw Error(`key_not_found: No suitable signing key found for ${identifier.did}`)
    verificationMethodId = signingKey.meta.verificationMethod.id
    return { signingKey, verificationMethodId }
  }
}
