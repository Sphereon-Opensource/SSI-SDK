import { IAgentContext, IPluginMethodMap, VerifiableCredential } from '@veramo/core';

export interface IVcApiIssuer extends IPluginMethodMap {
  issueCredentialUsingVcApi(args: IIssueCredentialArgs, context: IRequiredContext): Promise<VerifiableCredential>;
}

export interface IVcApiIssuerArgs {
  issueUrl: string;
  authorizationToken: string;
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

export interface ICredential {
  '@context': string[];
  id?: string;
  type: string[] | string;
  issuer: string | ICredentialIssuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: ICredentialSubject | ICredentialSubject[];
  credentialStatus?: ICredentialStatus;
  [x: string]: unknown;
}

export interface IIssueCredentialArgs {
  credential: ICredential;
}

export enum events {
  CREDENTIAL_ISSUED = 'credentialIssued',
}

export type IRequiredContext = IAgentContext<Record<string, never>>;
