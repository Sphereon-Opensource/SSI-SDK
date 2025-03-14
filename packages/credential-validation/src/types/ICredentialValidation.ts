import { IAgentContext, ICredentialVerifier, IPluginMethodMap } from '@veramo/core'
import { HasherSync, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '@sphereon/ssi-types'
import { ImDLMdoc } from '@sphereon/ssi-sdk.mdl-mdoc'
import { OriginalVerifiableCredential } from '@sphereon/ssi-types/dist'

export interface ICredentialValidation extends IPluginMethodMap {
  cvVerifyCredential(args: VerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult>
  cvVerifySchema(args: ValidateSchemaArgs): Promise<VerificationResult>
  cvVerifyMdoc(args: VerifyMdocCredentialArgs, context: RequiredContext): Promise<VerificationResult>
  cvVerifySDJWTCredential(args: VerifySDJWTCredentialArgs, context: RequiredContext): Promise<VerificationResult>
  cvVerifyW3CCredential(args: VerifyW3CCredentialArgs, context: RequiredContext): Promise<VerificationResult>
}

export enum SchemaValidation {
  ALWAYS = 'ALWAYS',
  NEVER = 'NEVER',
  WHEN_PRESENT = 'WHEN_PRESENT',
}

export type VerifyCredentialArgs = {
  credential: OriginalVerifiableCredential
  hasher?: HasherSync
  fetchRemoteContexts: boolean
  policies?: VerificationPolicies
}

export type VerificationPolicies = {
  schemaValidation?: SchemaValidation
  credentialStatus?: boolean
  expirationDate: boolean
  issuanceDate: boolean
}

export type ValidateSchemaArgs = {
  credential: OriginalVerifiableCredential
  validationPolicy?: SchemaValidation
  hasher?: HasherSync
}

export type VerifyMdocCredentialArgs = { credential: string }

export type VerifySDJWTCredentialArgs = {
  credential: string
  hasher?: HasherSync
}

export type VerifyW3CCredentialArgs = {}

export type VerificationResult = {
  result: boolean
  source: WrappedVerifiableCredential | WrappedVerifiablePresentation
  subResults: Array<VerificationSubResult>
  error?: string | undefined
  errorDetails?: string
}

export type VerificationSubResult = {
  result: boolean
  error?: string
  errorDetails?: string
}

export type CredentialVerificationError = {
  error?: string
  errorDetails?: string
}

export type RequiredContext = IAgentContext<ImDLMdoc & ICredentialVerifier>
