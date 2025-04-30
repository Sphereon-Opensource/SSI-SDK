import type {
  CredentialPayload,
  IAgentContext,
  IDIDManager,
  IKey,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
  IVerifyResult,
  PresentationPayload,
  VerificationPolicies
} from '@veramo/core'

import type { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'

import type { IIssueCredentialStatusOpts } from '@sphereon/ssi-sdk.vc-status-list'
import type { W3CVerifiableCredential, W3CVerifiablePresentation } from '@sphereon/ssi-types'

export type IVcdmCredentialPlugin = IVcdmCredentialIssuer & IVcdmCredentialVerifier

/**
 * Encapsulates the parameters required to check if a credential type can be issued
 *
 * @public
 */
export interface ICanIssueCredentialTypeArgs {
  proofFormat: string
}

/**
 * Encapsulates the parameters required to check if a document can be verified
 *
 * @public
 */
export interface ICanVerifyDocumentTypeArgs {
  /**
   * The document to check against the verifier
   */
  document: W3CVerifiableCredential | W3CVerifiablePresentation
}

/**
 * Encapsulates the parameters required to create a
 * {@link https://www.w3.org/TR/vc-data-model/#presentations | W3C Verifiable Presentation}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ICreateVerifiablePresentationLDArgs {
  /**
   * The json payload of the Presentation according to the
   * {@link https://www.w3.org/TR/vc-data-model/#presentations | canonical model}.
   *
   * The signer of the Presentation is chosen based on the `holderDID` property
   * of the `presentation`
   *
   * '@context', 'type' and 'issuanceDate' will be added automatically if omitted
   */
  presentation: PresentationPayload

  /**
   * Optional (only JWT) string challenge parameter to add to the verifiable presentation.
   */
  challenge?: string

  /**
   * Optional string domain parameter to add to the verifiable presentation.
   */
  domain?: string

  purpose?: IAuthenticationProofPurpose | IControllerProofPurpose | IAssertionProofPurpose | IProofPurpose

  /**
   * The desired format for the VerifiableCredential to be created.
   */
  proofFormat: string

  /**
   * Remove payload members during JWT-JSON transformation. Defaults to `true`.
   * See https://www.w3.org/TR/vc-data-model/#jwt-encoding
   */
  removeOriginalFields?: boolean

  /**
   * [Optional] The ID of the key that should sign this presentation.
   * If this is not specified, the first matching key will be used.
   */
  keyRef?: string

  /**
   * When dealing with JSON-LD you also MUST provide the proper contexts.
   * Set this to `true` ONLY if you want the `@context` URLs to be fetched in case they are not preloaded.
   * The context definitions SHOULD rather be provided at startup instead of being fetched.
   *
   * Defaults to `false`
   */
  fetchRemoteContexts?: boolean

  /**
   * Optional date to use for the `issuanceDate` or `validFrom` property depending on VCDM version being used.
   * If not specified, the current date will be used.
   *
   */
  now?: Date | number
}

/**
 * Encapsulates the parameters required to create a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ICreateVerifiableCredentialLDArgs {
  /**
   * The JSON payload of the Credential according to the
   * {@link https://www.w3.org/TR/vc-data-model/#credentials | canonical model}
   *
   * The signer of the Credential is chosen based on the `issuer.id` property
   * of the `credential`
   *
   * `@context`, `type` and `issuanceDate` will be added automatically if omitted
   */
  credential: CredentialPayload

  /**
   * Optional date to use for the `issuanceDate` or `validFrom` property depending on VCDM version being used.
   * If not specified, the current date will be used.
   *
   */
  now?: Date | number

  /**
   * The desired format for the VerifiableCredential to be created.
   */
  proofFormat: string

  /**
   * Remove payload members during JWT-JSON transformation. Defaults to `true`.
   * See https://www.w3.org/TR/vc-data-model/#jwt-encoding
   */
  removeOriginalFields?: boolean

  /**
   * [Optional] The ID of the key that should sign this credential.
   * If this is not specified, the first matching key will be used.
   */
  keyRef?: string

  /**
   * When dealing with JSON-LD you also MUST provide the proper contexts.
   * Set this to `true` ONLY if you want the `@context` URLs to be fetched in case they are not preloaded.
   * The context definitions SHOULD rather be provided at startup instead of being fetched.
   *
   * Defaults to `false`
   */
  fetchRemoteContexts?: boolean

  /**
   * Use this purpose for the verification method in the DID when doing a check (defaults to CredentialIssuancePurpose)
   */
  purpose?: IAuthenticationProofPurpose | IControllerProofPurpose | IAssertionProofPurpose | IProofPurpose

  credentialStatusOpts?: IIssueCredentialStatusOpts
}

/**
 * Encapsulates the parameters required to verify a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IVerifyCredentialLDArgs {
  /**
   * The json payload of the Credential according to the
   * {@link https://www.w3.org/TR/vc-data-model/#credentials | canonical model}
   *
   * The signer of the Credential is chosen based on the `issuer.id` property
   * of the `credential`
   *
   */
  credential: VerifiableCredentialSP

  /**
   * Set this to true if you want the '@context' URLs to be fetched in case they are not pre-loaded.
   *
   * @default false
   */
  fetchRemoteContexts?: boolean

  /**
   * Overrides specific aspects of credential verification, where possible.
   */
  policies?: VerificationPolicies

  /**
   * Use this presentation purpose for the verification method in the DID when doing a check (defaults to CredentialIssuancePurpose)
   */
  purpose?: IAuthenticationProofPurpose | IControllerProofPurpose | IAssertionProofPurpose | IProofPurpose

  /**
   * Check status function, to check verifiableCredentials that have a credentialStatus property
   */
  checkStatus?: Function

  /**
   * Allows you to use the default integrated statusList 2021 support. If a checkStatus function is provided, this will be ignored
   */
  statusList?: StatusListCheck

  [key: string]: any
}

export interface StatusListCheck {
  /**
   * If no checkStatus function is given we default to a StatusList2021 check in case the VC has a credentialStatus. This boolean allows to disable this fallback check
   */
  disableCheckStatusList2021?: boolean

  mandatoryCredentialStatus: boolean
  verifyStatusListCredential: boolean
  verifyMatchingIssuers: boolean
  errorUnknownListType?: boolean
}

/**
 * Encapsulates the parameters required to verify a
 * {@link https://www.w3.org/TR/vc-data-model/#presentations | W3C Verifiable Presentation}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IVerifyPresentationLDArgs {
  /**
   * The json payload of the Credential according to the
   * {@link https://www.w3.org/TR/vc-data-model/#credentials | canonical model}
   *
   * The signer of the Credential is chosen based on the `issuer.id` property
   * of the `credential`
   *
   */
  presentation: VerifiablePresentationSP | W3CVerifiablePresentation

  /**
   * Optional (only for JWT) string challenge parameter to verify the verifiable presentation against
   */
  challenge?: string

  /**
   * Optional (only for JWT) string domain parameter to verify the verifiable presentation against
   */
  domain?: string

  /**
   * Set this to true if you want the '@context' URLs to be fetched in case they are not pre-loaded.
   *
   * @default false
   */
  fetchRemoteContexts?: boolean

  /**
   * Overrides specific aspects of credential verification, where possible.
   */
  policies?: VerificationPolicies

  /**
   * Use this presentation purpose for the verification method in the DID when doing a check (defaualts to assertionMethod)
   */
  presentationPurpose?: IAuthenticationProofPurpose | IControllerProofPurpose | IAssertionProofPurpose | IProofPurpose

  /**
   * Check status function, to check verifiableCredentials that have a credentialStatus property
   */
  checkStatus?: Function

  /**
   * Allows you to use the default integrated statusList 2021 support. If a checkStatus function is provided, this will be ignored
   */
  statusList?: StatusListCheck

  [key: string]: any
}

/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
/*
export type IRequiredContext = IAgentContext<
  IResolver & IDIDManager & Pick<ISphereonKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'>
>
*/

/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 *
 * @beta
 */
export type IVcdmIssuerAgentContext = IAgentContext<
  IResolver & IDIDManager & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'>
>

export type ContextDoc = {
  '@context': string | Record<string, any>
}

/*
  @beta
 */
export interface IProofPurpose {
  term?: string
  date?: string | Date | number
  maxTimestampDelta?: number
}

/*
  @beta
 */
export interface IControllerProofPurpose extends IProofPurpose {
  controller?: object
}

/*
  @beta
 */
export interface IAuthenticationProofPurpose extends IControllerProofPurpose {
  challenge?: string
  domain?: string
}

/*
  @beta
 */
export interface IAssertionProofPurpose extends IControllerProofPurpose {}

/**
 * The interface definition for a plugin that can generate Verifiable Credentials and Presentations
 *
 * @see {@link @veramo/credential-w3c#CredentialPlugin} for an implementation.
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @public
 */
export interface IVcdmCredentialProvider {
  /**
   * Creates a Verifiable Presentation.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiablePresentation} that was requested or
   *   rejects with an error if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Presentation data model
   *   }
   */
  createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP>

  /**
   * Creates a Verifiable Presentation.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiablePresentation} that was requested or
   *   rejects with an error if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Presentation data model
   *   }
   */
  canIssueCredentialType(args: ICanIssueCredentialTypeArgs): boolean

  /**
   * Matches a key against the type of proof supported by this issuer
   *
   * @param key - The key to match against the proof type(s) supported by this issuer
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to a boolean indicating if the key can be used to sign a credential with this issuer
   */
  matchKeyForType(key: IKey): boolean

  /**
   * Gets the proof type supported by this issuer
   *
   * @returns - a promise that resolves to a string of the proof format supported by this issuer
   */
  getTypeProofFormat(): string

  /**
   * Creates a Verifiable Credential.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiableCredential} that was requested or
   *   rejects with an error if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   */
  createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP>

  /**
   * Verifies a Verifiable Credential
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to an object containing a `verified` boolean property and an optional `error`
   *   for details
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   */
  verifyCredential(args: IVerifyCredentialLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult>

  /**
   *
   * @param args - Arguments necessary to verify a document
   * @param context  - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns a promise that resolves to a boolean indicating if the document can be verified
   */
  canVerifyDocumentType(args: ICanVerifyDocumentTypeArgs): boolean

  /**
   * Verifies a Verifiable Presentation JWT or LDS Format.
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to an object containing a `verified` boolean property and an optional `error`
   *   for details
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Credential data model}
   */
  verifyPresentation(args: IVerifyPresentationLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult>
}

/**
 * The interface definition for a plugin that can generate Verifiable Credentials and Presentations
 *
 * @see {@link @veramo/credential-w3c#CredentialPlugin} for an implementation.
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @public
 */
export interface IVcdmCredentialIssuer extends IPluginMethodMap {
  /**
   * Creates a Verifiable Presentation.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiablePresentation} that was requested or
   *   rejects with an error if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Presentation data model
   *   }
   */
  createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP>

  /**
   * Creates a Verifiable Credential.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiableCredential} that was requested or rejects
   *   with an error if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   */
  createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP>
}

/**
 * The interface definition for a plugin that can generate Verifiable Credentials and Presentations
 *
 * @see {@link @veramo/credential-w3c#CredentialPlugin} for an implementation.
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @public
 */
export interface IVcdmCredentialVerifier extends IPluginMethodMap {
  /**
   * Verifies a Verifiable Credential
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to an object containing a `verified` boolean property and an optional `error`
   *   for details
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   */
  verifyCredential(args: IVerifyCredentialLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult>

  /**
   * Verifies a Verifiable Presentation JWT or LDS Format.
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to an object containing a `verified` boolean property and an optional `error`
   *   for details
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Credential data model}
   */
  verifyPresentation(args: IVerifyPresentationLDArgs, context: IVcdmVerifierAgentContext): Promise<IVerifyResult>
}

/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 *
 * @beta
 */
export type IVcdmVerifierAgentContext = IAgentContext<IResolver & Pick<IDIDManager, 'didManagerGet' | 'didManagerFind'>>
