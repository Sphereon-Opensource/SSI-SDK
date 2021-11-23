import { IAgentContext, IPluginMethodMap } from '@veramo/core';

export interface IVcApiVerifier extends IPluginMethodMap {
  verifyCredentialUsingVcApi(args: IVerifyCredentialArgs, context: IRequiredContext): Promise<IVerifyCredentialResult>;
}

export interface IVcApiVerifierArgs {
  verifyUrl: string;
}

export interface ICredentialStatus {
  id: string;
  type: string;
  revocationListIndex?: string;
  revocationListCredential?: string;
}

export interface ICredentialIssuer {
  id: string;
  [x: string]: unknown;
}

export interface ICredentialSubject {
  id?: string;
  [x: string]: unknown;
}

export interface ICredentialProof {
  type?: string;
  [x: string]: unknown;
}

export interface ICredential {
  '@context': string[];
  id?: string;
  type: string[] | string;
  issuer: string | ICredentialIssuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject?: ICredentialSubject | ICredentialSubject[];
  credentialStatus?: ICredentialStatus;
  proof: ICredentialProof;
  [x: string]: unknown;
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
