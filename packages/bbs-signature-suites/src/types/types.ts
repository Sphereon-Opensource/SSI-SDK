import { purposes } from '@digitalcredentials/jsonld-signatures'
import {
  IAgentContext,
  IDIDManager,
  IKeyManager,
  IPluginMethodMap,
  IResolver,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core'
import {IVerifiableCredential, IVerifiablePresentation} from "@sphereon/pex";

/**
 * The interface definition for a plugin that can issue and verify Verifiable Credentials and Presentations
 * that use JSON-LD format.
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ICredentialIssuerLD extends IPluginMethodMap {
  verifyBbsSignaturePresentation(args:IVerifyBbsSignaturePresentationArgs, context: IRequiredContext): Promise<boolean>
  verifyBbsSignatureCredential(args:IVerifyBbsSignatureCredentialArgs, context: IRequiredContext): Promise<boolean>
  signBbsSignatureCredential(args:ISignBbsSignatureCredentialArgs, context: IRequiredContext): Promise<IVerifiableCredential>
  signBbsSignaturePresentation(args:ISignBbsSignaturePresentationArgs, context: IRequiredContext): Promise<IVerifiablePresentation>
}

/**
 * Encapsulates the parameters required to verify a
 * {@link https://www.w3.org/TR/vc-data-model/#presentations | W3C Verifiable Presentation}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IVerifyBbsSignaturePresentationArgs {
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
  presentationPurpose?: typeof ProofPurpose

  /**
   * Check status function, to check credentials that have a credentialStatus property
   */
  checkStatus?: Function
}

/**
 * Encapsulates the parameters required to verify a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IVerifyBbsSignatureCredentialArgs {
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
  purpose?: typeof ProofPurpose

  /**
   * Check status function, to check credentials that have a credentialStatus property
   */
  checkStatus?: Function
}

/**
 * Encapsulates the parameters required to verify a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ISignBbsSignatureCredentialArgs {
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
  purpose?: typeof ProofPurpose

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
export interface ISignBbsSignaturePresentationArgs {
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
  presentationPurpose?: typeof ProofPurpose

  /**
   * Check status function, to check credentials that have a credentialStatus property
   */
  checkStatus?: Function
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
