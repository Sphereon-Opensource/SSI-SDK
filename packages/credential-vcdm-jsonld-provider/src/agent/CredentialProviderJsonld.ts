import { getAgentResolver, mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-ext.did-utils'
import { asArray, intersect, VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import {
  ContextDoc,
  ICanIssueCredentialTypeArgs,
  ICanVerifyDocumentTypeArgs,
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IVcdmCredentialProvider,
  IVcdmIssuerAgentContext,
  IVcdmVerifierAgentContext,
  IVerifyCredentialVcdmArgs,
  IVerifyPresentationLDArgs,
  preProcessCredentialPayload,
  preProcessPresentation
} from '@sphereon/ssi-sdk.credential-vcdm'
import { vcLibCheckStatusFunction } from '@sphereon/ssi-sdk.vc-status-list'
import { IVerifyResult } from '@sphereon/ssi-types'
import type {
  DIDDocument,
  IAgentContext,
  IDIDManager,
  IIdentifier,
  IKey,
  IResolver,
  VerifiableCredential
} from '@veramo/core'
import { AbstractPrivateKeyStore } from '@veramo/key-manager'
import { type _ExtendedIKey, type OrPromise, type RecordLike } from '@veramo/utils'
import Debug from 'debug'

import { LdContextLoader } from '../ld-context-loader'
import { LdCredentialModule } from '../ld-credential-module'
import { LdDefaultContexts } from '../ld-default-contexts'
import { LdSuiteLoader } from '../ld-suite-loader'
import { SphereonLdSignature } from '../ld-suites'
import { SphereonEcdsaSecp256k1RecoverySignature2020, SphereonEd25519Signature2020 } from '../suites'

const debug = Debug('sphereon:ssi-sdk:ld-credential-module-local')

/**
 * {@inheritDoc IVcLocalIssuerJsonLd}
 */
export class CredentialProviderJsonld implements IVcdmCredentialProvider {
  private ldCredentialModule: LdCredentialModule
  private keyStore?: AbstractPrivateKeyStore

  constructor(options: {
    contextMaps?: RecordLike<OrPromise<ContextDoc>>[]
    suites?: SphereonLdSignature[]
    keyStore?: AbstractPrivateKeyStore
    documentLoader?: {
      localResolution?: boolean // Resolve identifiers hosted by the agent
      uniresolverResolution?: boolean // Resolve identifiers using universal resolver
      resolverResolution?: boolean // Use registered drivers
    }
  }) {
    this.keyStore = options.keyStore
    this.ldCredentialModule = new LdCredentialModule({
      ldContextLoader: new LdContextLoader({ contextsPaths: options.contextMaps ?? [LdDefaultContexts] }),
      ldSuiteLoader: new LdSuiteLoader({
        ldSignatureSuites: options.suites ?? [new SphereonEd25519Signature2020(), new SphereonEcdsaSecp256k1RecoverySignature2020()],
      }),
      documentLoader: options?.documentLoader,
    })

    // this.overrideBindings(options.bindingOverrides)
  }
  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.matchKeyForType} */
  matchKeyForType(key: IKey): boolean {
    return this.matchKeyForLDSuite(key)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.getTypeProofFormat} */
  getTypeProofFormat(): string {
    return 'lds'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canIssueCredentialType} */
  canIssueCredentialType(args: ICanIssueCredentialTypeArgs): boolean {
    return args.proofFormat === 'lds'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canVerifyDocumentType */
  canVerifyDocumentType(args: ICanVerifyDocumentTypeArgs): boolean {
    const { document } = args
    if (typeof document === 'string') {
      return false
    }
    const proofType = (<VerifiableCredential>document)?.proof?.type ?? '_never_'
    for (const suite of this.ldCredentialModule.ldSuiteLoader.getAllSignatureSuites()) {
      if (suite.getSupportedProofType() === proofType) {
        return true
      } else if (asArray(suite.getSupportedVerificationType()).includes(proofType)) {
        return true
      }
    }

    return false
  }

  /** {@inheritDoc ICredentialIssuerLDLocal.createVerifiableCredential} */
  async createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP> {
    debug('Entry of createVerifiableCredential')
    const { credential, issuer } = preProcessCredentialPayload(args)

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

  async getSigningKey(identifier: IIdentifier, keyRef?: string) {
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
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    const { presentation, holder } = preProcessPresentation(args)

    if (presentation.verifiableCredential) {
      const credentials = presentation.verifiableCredential.map((cred) => {
        if (typeof cred !== 'string' && cred.proof?.jwt) {
          return cred.proof.jwt
        } else {
          return cred
        }
      })
      presentation.verifiableCredential = credentials
    }

    //issuanceDate/validFrom must not be present for presentations because it is not defined in a @context
    delete presentation.issuanceDate
    delete presentation.validFrom

    let identifier: IIdentifier
    try {
      identifier = await context.agent.didManagerGet({ did: holder })
    } catch (e) {
      throw new Error(`invalid_argument: args.presentation.holderDID ${holder} must be a DID managed by this agent`)
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

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialVcdmArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult> {
    const credential = args.credential
    let checkStatus = args.checkStatus
    if (typeof checkStatus !== 'function' && (!args.statusList || args.statusList.disableCheckStatusList2021 !== true)) {
      checkStatus = vcLibCheckStatusFunction({
        ...args.statusList,
        verifyStatusListCredential: false /*todo: enable. Needs calling this method first and not rely on @digiticalcredentials*/,
      }) // todo: Probably should be moved to the module to have access to the loaders
    }
    return this.ldCredentialModule.verifyCredential(credential as VerifiableCredentialSP, context, args.fetchRemoteContexts, args.purpose, checkStatus)
  }

  /** {@inheritdoc ICredentialHandlerLDLocal.verifyPresentation} */
  async verifyPresentation(args: IVerifyPresentationLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult> {
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

    if (!signingKey) throw Error(`key_not_found: No suitable signing key found for ${identifier.did}. ${JSON.stringify(didDocument)}`)
    const verificationMethodId = signingKey.meta.verificationMethod.id
    debug(`Signing key for id ${identifier.did} and verification method id ${verificationMethodId} found.`)
    return { signingKey, verificationMethodId }
  }

  /**
   * Returns true if the key is supported by any of the installed LD Signature suites
   * @param k - the key to match
   *
   * @internal
   */
  matchKeyForLDSuite(k: IKey): boolean {
    // prefilter based on key algorithms
    switch (k.type) {
      case 'Ed25519':
        if (!k.meta?.algorithms?.includes('EdDSA')) return false
        break
      case 'Secp256k1':
        if (intersect(k.meta?.algorithms ?? [], ['ES256K-R', 'ES256K']).length == 0) return false
        break
    }

    // TODO: this should return a list of supported suites, not just a boolean
    const suites = this.ldCredentialModule.ldSuiteLoader.getAllSignatureSuites()
    return suites
      .map((suite: SphereonLdSignature) => suite.getSupportedKeyType().includes(k.type))
      .some((supportsThisKey: boolean) => supportsThisKey)
  }
}
