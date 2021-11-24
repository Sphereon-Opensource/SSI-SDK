import { IAgentContext, IPluginMethodMap } from '@veramo/core';
import {ICredential} from "../../../ssi-sdk-core/src";

export interface IVcApiVerifier extends IPluginMethodMap {
  verifyCredentialUsingVcApi(args: IVerifyCredentialArgs, context: IRequiredContext): Promise<IVerifyCredentialResult>;
}

export interface IVcApiVerifierArgs {
  verifyUrl: string;
}

export interface IVerifyCredentialArgs {
  credential: ICredential;
}

export interface IVerifyCredentialResult {
  checks: string[];
  errors: string[];
  warnings: string[];
}

export enum events {
  CREDENTIAL_VERIFIED = 'credentialVerified',
}

export type IRequiredContext = IAgentContext<Record<string, never>>;
