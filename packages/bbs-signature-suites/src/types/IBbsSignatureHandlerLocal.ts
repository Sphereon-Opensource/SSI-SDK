import { IAgentContext, IDIDManager, IKeyManager, IPluginMethodMap, IResolver } from '@veramo/core'

import {
  ISignBbsSignatureCredentialArgs,
  ISignBbsSignaturePresentationArgs,
  IVerifyBbsSignatureCredentialArgs,
  IVerifyBbsSignaturePresentationArgs,
} from './types'
import { IVerifiableCredential, IVerifiablePresentation } from '@sphereon/pex'

export interface IBbsSignatureHandlerLocal extends IPluginMethodMap {
  verifyBbsSignaturePresentationLocal(args: IVerifyBbsSignaturePresentationArgs, context: IRequiredContext): Promise<boolean>
  verifyBbsSignatureCredentialLocal(args: IVerifyBbsSignatureCredentialArgs, context: IRequiredContext): Promise<boolean>
  signBbsSignatureCredentialLocal(args: ISignBbsSignatureCredentialArgs, context: IRequiredContext): Promise<IVerifiableCredential>
  signBbsSignaturePresentationLocal(args: ISignBbsSignaturePresentationArgs, context: IRequiredContext): Promise<IVerifiablePresentation>
}

/**
 * Plugin method map interface
 * @public
 */
export enum MethodNames {
  verifyBbsSignaturePresentationLocal = 'verifyBbsSignaturePresentationLocal',
  verifyBbsSignatureCredentialLocal = 'verifyBbsSignatureCredentialLocal',
  signBbsSignatureCredentialLocal = 'signBbsSignatureCredentialLocal',
  signBbsSignaturePresentationLocal = 'signBbsSignaturePresentationLocal',
}

export type IBindingOverrides = Map<string, MethodNames>

export enum events {
  CREDENTIAL_SIGNED = 'credentialSigned',
  PRESENTATION_SIGNED = 'presentationSigned',
  CREDENTIAL_SIGNATURE_VERIFIED = 'credentialSignatureVerified',
  PRESENTATION_SIGNATURE_VERIFIED = 'presentationSignatureVerified',
}

export type IRequiredContext = IAgentContext<IResolver & Pick<IDIDManager, 'didManagerGet'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>
