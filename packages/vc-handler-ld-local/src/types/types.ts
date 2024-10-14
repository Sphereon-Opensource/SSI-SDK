import { purposes } from '@digitalcredentials/jsonld-signatures'
import { ISphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { IIssueCredentialStatusOpts } from '@sphereon/ssi-sdk.vc-status-list'
import {
  CredentialPayload,
  IAgentContext,
  IDIDManager,
  IResolver,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation
} from '@veramo/core'

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

  /**
   * Optional. The key handle ({@link IKey#kid}) from the internal database.
   */
  keyRef?: string

  purpose?: IAuthenticationProofPurpose | IControllerProofPurpose | IAssertionProofPurpose | IProofPurpose
}



/**
 * Encapsulates the parameters required to create a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ICreateVerifiableCredentialLDArgs {
  /**
   * The json payload of the Credential according to the
   * {@link https://www.w3.org/TR/vc-data-model/#credentials | canonical model}
   *
   * The signer of the Credential is chosen based on the `issuer.id` property
   * of the `credential`
   *
   * '@context', 'type' and 'issuanceDate' will be added automatically if omitted
   */
  credential: CredentialPayload

  /**
   * Optional. The key handle ({@link IKey#kid}) from the internal database.
   */
  keyRef?: string

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
  credential: VerifiableCredential

  /**
   * Set this to true if you want the '@context' URLs to be fetched in case they are not pre-loaded.
   *
   * @default false
   */
  fetchRemoteContexts?: boolean

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
  presentation: VerifiablePresentation

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
}

/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export type IRequiredContext = IAgentContext<
  IResolver & IDIDManager & Pick<ISphereonKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'>
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

export const ProofPurpose = purposes.ProofPurpose
export const ControllerProofPurpose = purposes.ControllerProofPurpose
export const AssertionProofPurpose = purposes.AssertionProofPurpose
export const AuthenticationProofPurpose = purposes.AuthenticationProofPurpose
