import { IAgentContext, IDIDManager, IKeyManager, IPluginMethod, IPluginMethodMap, IResolver } from '@veramo/core'
import { VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk-core'
import {
  ICreateVerifiableCredentialLDArgs,
  ICreateVerifiablePresentationLDArgs,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
} from '@veramo/credential-ld'

export interface ICredentialHandlerLDLocal extends IPluginMethodMap {
  createVerifiableCredentialLDLocal(args: ICreateVerifiableCredentialLDArgs, context: IRequiredContext): Promise<VerifiableCredentialSP>

  createVerifiablePresentationLDLocal(args: ICreateVerifiablePresentationLDArgs, context: IRequiredContext): Promise<VerifiablePresentationSP>

  verifyCredentialLDLocal(args: IVerifyCredentialLDArgs, context: IRequiredContext): Promise<boolean>

  verifyPresentationLDLocal(args: IVerifyPresentationLDArgs, context: IRequiredContext): Promise<boolean>
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
}

export type IRequiredContext = IAgentContext<IResolver & Pick<IDIDManager, 'didManagerGet'> & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign'>>
