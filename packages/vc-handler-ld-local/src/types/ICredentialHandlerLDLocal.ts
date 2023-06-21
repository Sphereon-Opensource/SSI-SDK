import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { IPluginMethodMap } from '@veramo/core'

import {
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IRequiredContext,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
} from './types'
import { IVerifyResult } from '@sphereon/ssi-types'

/**
 * The interface definition for a plugin that can issue and verify Verifiable Credentials and Presentations
 * that use JSON-LD format.
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface ICredentialHandlerLDLocal extends IPluginMethodMap {
  /**
   * Creates a Verifiable Credential.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiableCredential} that was requested or rejects with an error
   * if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  createVerifiableCredentialLDLocal(args: ICreateVerifiableCredentialLDArgs, context: IRequiredContext): Promise<VerifiableCredentialSP>

  /**
   * Creates a Verifiable Presentation.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiablePresentation} that was requested or rejects with an error
   * if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Presentation data model }
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  createVerifiablePresentationLDLocal(args: ICreateVerifiablePresentationLDArgs, context: IRequiredContext): Promise<VerifiablePresentationSP>

  /**
   * Verifies a Verifiable Credential JWT or LDS Format.
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the boolean true on successful verification or rejects on error
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  verifyCredentialLDLocal(args: IVerifyCredentialLDArgs, context: IRequiredContext): Promise<IVerifyResult>

  /**
   * Verifies a Verifiable Presentation JWT or LDS Format.
   *
   * @param args - Arguments necessary to verify a VerifiableCredential
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the boolean true on successful verification or rejects on error
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Credential data model}
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  verifyPresentationLDLocal(args: IVerifyPresentationLDArgs, context: IRequiredContext): Promise<IVerifyResult>
}

/**
 * Plugin method map interface
 * @public
 */
export enum MethodNames {
  createVerifiableCredentialLDLocal = 'createVerifiableCredentialLDLocal',
  createVerifiablePresentationLDLocal = 'createVerifiablePresentationLDLocal',
  verifyCredentialLDLocal = 'verifyCredentialLDLocal',
  verifyPresentationLDLocal = 'verifyPresentationLDLocal',
}

export type IBindingOverrides = Map<string, MethodNames>

export enum events {
  CREDENTIAL_ISSUED = 'credentialIssued',
  CREDENTIAL_VERIFIED = 'credentialVerified',
  PRESENTATION_VERIFIED = 'presentationVerified',
  PRESENTATION_VERIFY_FAILED = 'presentationVerificationFailed',
  CREDENTIAL_VERIFY_FAILED = 'credentialVerificationFailed',
}
