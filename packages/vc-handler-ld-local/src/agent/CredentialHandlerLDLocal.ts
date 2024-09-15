import { getAgentResolver, mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-ext.did-utils'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { vcLibCheckStatusFunction } from '@sphereon/ssi-sdk.vc-status-list'
import { IVerifyResult } from '@sphereon/ssi-types'
import {
  CredentialPayload,
  DIDDocument,
  IAgentContext,
  IAgentPlugin,
  IDIDManager,
  IIdentifier,
  IKey,
  IResolver,
  PresentationPayload,
} from '@veramo/core'
import { AbstractPrivateKeyStore } from '@veramo/key-manager'
import { _ExtendedIKey, extractIssuer, isDefined, MANDATORY_CREDENTIAL_CONTEXT, OrPromise, processEntryToArray, RecordLike } from '@veramo/utils'
import Debug from 'debug'

import { IBindingOverrides, IRequiredContext, schema } from '../index'
import { LdContextLoader } from '../ld-context-loader'
import { LdCredentialModule } from '../ld-credential-module'
import { LdSuiteLoader } from '../ld-suite-loader'
import { SphereonLdSignature } from '../ld-suites'
import {
  ContextDoc,
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  ICredentialHandlerLDLocal,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
} from '../types'

const debug = Debug('sphereon:ssi-sdk:ld-credential-module-local')

/**
 * {@inheritDoc IVcLocalIssuerJsonLd}
 */
export class CredentialHandlerLDLocal implements IAgentPlugin {
  private ldCredentialModule: LdCredentialModule
  readonly schema = schema.ICredentialHandlerLDLocal
  readonly methods: ICredentialHandlerLDLocal = {
    // test: this.createVerifiableCredentialLDLocal.bind(this),
    // We bind to existing methods as we can act as a drop in replacement. todo: Add config support for this mode
    // createVerifiableCredentialLD: this.createVerifiableCredentialLDLocal.bind(this),
    // createVerifiablePresentationLD: this.createVerifiablePresentationLDLocal.bind(this),
    verifyPresentationLD: this.verifyPresentationLDLocal.bind(this),
    verifyCredentialLD: this.verifyCredentialLDLocal.bind(this),
    createVerifiableCredentialLDLocal: this.createVerifiableCredentialLDLocal.bind(this),
    createVerifiablePresentationLDLocal: this.createVerifiablePresentationLDLocal.bind(this),
    verifyPresentationLDLocal: this.verifyPresentationLDLocal.bind(this),
    verifyCredentialLDLocal: this.verifyCredentialLDLocal.bind(this),
  }
  private keyStore?: AbstractPrivateKeyStore

  constructor(options: {
    contextMaps: RecordLike<OrPromise<ContextDoc>>[]
    suites: SphereonLdSignature[]
    bindingOverrides?: IBindingOverrides
    keyStore?: AbstractPrivateKeyStore
    documentLoader?: {
      localResolution?: boolean // Resolve identifiers hosted by the agent
      uniresolverResolution?: boolean // Resolve identifiers using universal resolver
      resolverResolution?: boolean // Use registered drivers
    }
  }) {
    this.keyStore = options.keyStore
    this.ldCredentialModule = new LdCredentialModule({
      ldContextLoader: new LdContextLoader({ contextsPaths: options.contextMaps }),
      ldSuiteLoader: new LdSuiteLoader({ ldSignatureSuites: options.suites }),
      documentLoader: options?.documentLoader,
    })

    this.overrideBindings(options.bindingOverrides)
  }

  private overrideBindings(overrides?: IBindingOverrides) {
    overrides?.forEach((methodName, bindingName) => {
      if (typeof this[methodName] === 'function') {
        this.methods[bindingName] = this[methodName].bind(this)
      } else {
        throw new Error(`Method ${methodName} supplied as target for ${bindingName} is not a valid method in CredentialHandlerLDLocal`)
      }
      debug(`binding: this.${bindingName}() -> CredentialHandlerLDLocal.${methodName}()`)
    })
  }

  /** {@inheritDoc ICredentialIssuerLDLocal.createVerifiableCredentialLDLocal} */
  private async createVerifiableCredentialLDLocal(
    args: ICreateVerifiableCredentialLDArgs,
    context: IRequiredContext,
  ): Promise<VerifiableCredentialSP> {
    debug('Entry of createVerifiableCredentialLDLocal')
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
    //fixme: Potential PII leak
    debug(JSON.stringify(credential))

    const issuer = extractIssuer(credential)
    if (!issuer || typeof issuer === 'undefined') {
      throw new Error('invalid_argument: args.credential.issuer must not be empty')
    }

    let identifier: IIdentifier
    try {
      debug(`Retrieving identifier for issuer ${issuer} from DID manager...`)
      identifier = await context.agent.didManagerGet({ did: issuer })
      debug(`Identifier for issuer ${issuer} retrieved from DID manager`)
    } catch (e) {
      throw new Error(`invalid_argument: args.credential.issuer must be a DID managed by this agent. ${e}`)
    }
    try {
      const { managedKey, verificationMethod } = await this.getSigningKey(identifier, args.keyRef)
      const { signingKey, verificationMethodId } = await this.findSigningKeyWithId(context, identifier, { keyRef: args.keyRef })
      return await this.ldCredentialModule.issueLDVerifiableCredential(
        {
          credential,
          issuerDid: identifier.did,
          key: managedKey ?? signingKey, // todo: signingKey does not have the private key, so would never work
          verificationMethodId: verificationMethodId ?? (verificationMethod as string),
          purpose: args.purpose,
          credentialStatusOpts: args.credentialStatusOpts,
        },
        context,
      )
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  private async getSigningKey(identifier: IIdentifier, keyRef?: string) {
    let managedKey: IKey | undefined
    let verificationMethod: string | undefined
    if (keyRef) {
      const k = await this.keyStore?.get({ alias: keyRef })
      if (k?.privateKeyHex) {
        managedKey = {
          ...identifier.keys.find((k) => k.kid === keyRef),
          privateKeyHex: k.privateKeyHex as string,
        } as IKey
        verificationMethod = `${identifier.did}#${managedKey.kid ? managedKey.kid : k.alias}`
      }
    }
    return { managedKey, verificationMethod }
  }

  /** {@inheritdoc ICredentialIssuerLD.createVerifiablePresentationLD} */
  private async createVerifiablePresentationLDLocal(
    args: ICreateVerifiablePresentationLDArgs,
    context: IRequiredContext,
  ): Promise<VerifiablePresentationSP> {
    const presentationContext = processEntryToArray(args?.presentation?.['@context'], MANDATORY_CREDENTIAL_CONTEXT)
    const presentationType = processEntryToArray(args?.presentation?.type, 'VerifiablePresentation')

    const presentation: PresentationPayload = {
      ...args?.presentation,
      '@context': presentationContext,
      type: presentationType,
    }
    // Workaround for bug in TypeError: Cannot read property 'length' of undefined
    //     at VeramoEd25519Signature2018.preSigningPresModification
    /*if (!presentation.verifier) {
          presentation.verifier = []
        }*/

    if (!isDefined(presentation.holder) || !presentation.holder) {
      throw new Error('invalid_argument: args.presentation.holderDID must not be empty')
    }

    if (args.presentation.verifiableCredential) {
      const credentials = args.presentation.verifiableCredential.map((cred) => {
        if (typeof cred !== 'string' && cred.proof?.jwt) {
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
      throw new Error('invalid_argument: args.presentation.holderDID must be a DID managed by this agent')
    }
    try {
      const { managedKey, verificationMethod } = await this.getSigningKey(identifier, args.keyRef)
      const { signingKey, verificationMethodId } = await this.findSigningKeyWithId(context, identifier, { keyRef: args.keyRef })

      return await this.ldCredentialModule.signLDVerifiablePresentation(
        presentation,
        identifier.did,
        managedKey || signingKey, // todo: signingKey does not have the private key, so would never work
        verificationMethodId ? verificationMethodId : (verificationMethod as string),
        args.challenge,
        args.domain,
        args.purpose,
        context,
      )
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyCredentialLDLocal} */
  public async verifyCredentialLDLocal(args: IVerifyCredentialLDArgs, context: IRequiredContext): Promise<IVerifyResult> {
    const credential = args.credential
    let checkStatus = args.checkStatus
    if (typeof checkStatus !== 'function' && (!args.statusList || args.statusList.disableCheckStatusList2021 !== true)) {
      checkStatus = vcLibCheckStatusFunction({
        ...args.statusList,
        verifyStatusListCredential: false /*todo: enable. Needs calling this method first and not rely on @digiticalcredentials*/,
      }) // todo: Probably should be moved to the module to have access to the loaders
    }
    return this.ldCredentialModule.verifyCredential(credential, context, args.fetchRemoteContexts, args.purpose, checkStatus)
  }

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyPresentationLDLocal} */
  public async verifyPresentationLDLocal(args: IVerifyPresentationLDArgs, context: IRequiredContext): Promise<IVerifyResult> {
    const presentation = args.presentation
    let checkStatus = args.checkStatus
    if (typeof checkStatus !== 'function' && args.statusList && !args.statusList.disableCheckStatusList2021) {
      checkStatus = vcLibCheckStatusFunction({ ...args.statusList })
    }
    return this.ldCredentialModule.verifyPresentation(
      presentation,
      args.challenge,
      args.domain,
      context,
      args.fetchRemoteContexts,
      args.presentationPurpose,
      checkStatus,
    )
  }

  private async findSigningKeyWithId(
    context: IAgentContext<IResolver & IDIDManager>,
    identifier: IIdentifier,
    opts?: {
      keyRef?: string
      didDocument?: DIDDocument
    },
  ): Promise<{ signingKey: IKey; verificationMethodId: string }> {
    const keyRef = opts?.keyRef
    debug(`Retrieving signing key for id ${identifier.did} keyref ${keyRef}...`)
    const didDocument =
      opts?.didDocument ??
      (await getAgentResolver(context)
        .resolve(identifier.did)
        .then((result) => result.didDocument ?? undefined))
    const extendedKeys: _ExtendedIKey[] = await mapIdentifierKeysToDocWithJwkSupport(
      { identifier, vmRelationship: 'verificationMethod', didDocument },
      context,
    )
    const supportedTypes = this.ldCredentialModule.ldSuiteLoader.getAllSignatureSuiteTypes()
    let signingKey: _ExtendedIKey | undefined
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
      signingKey = extendedKeys.find((k) => supportedTypes.filter((value) => value.startsWith(k.meta.verificationMethod.type)))
    }

    if (!signingKey) throw Error(`key_not_found: No suitable signing key found for ${identifier.did}`)
    const verificationMethodId = signingKey.meta.verificationMethod.id
    debug(`Signing key for id ${identifier.did} and verification method id ${verificationMethodId} found.`)
    return { signingKey, verificationMethodId }
  }
}
