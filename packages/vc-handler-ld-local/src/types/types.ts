import { purposes } from '@digitalcredentials/jsonld-signatures'
import {
  CredentialPayload,
  IAgentContext,
  IDIDManager,
  IKeyManager,
  IResolver,
  PresentationPayload,
  VerifiableCredential,
  VerifiablePresentation,
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
   * The signer of the Presentation is chosen based on the `holder` property
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

  purpose?: IProofPurpose
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
  purpose?: IProofPurpose
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
  purpose?: IProofPurpose

  /**
   * Check status function, to check credentials that have a credentialStatus property
   */
  checkStatus?: Function
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
  presentationPurpose?: IProofPurpose

  /**
   * Check status function, to check credentials that have a credentialStatus property
   */
  checkStatus?: Function
}

export interface IProofPurpose {
  term?: string
  date?: string | Date | number
  maxTimestampDelta?: number
  controller?: object
  challenge?: string
  domain?: string
}



/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export type IRequiredContext = IAgentContext<IResolver & Pick<IDIDManager, 'didManagerGet'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>

export type ContextDoc = {
  '@context': string | Record<string, any>
}

export const ProofPurpose = purposes.ProofPurpose
export const ControllerProofPurpose = purposes.ControllerProofPurpose
export const AssertionProofPurpose = purposes.AssertionProofPurpose
export const AuthenticationProofPurpose = purposes.AuthenticationProofPurpose
