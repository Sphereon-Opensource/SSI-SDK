import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  type CredentialProofFormat,
  type ICredential,
  type ICredentialStatus,
  type IIssuer,
  type IVerifiableCredential,
  type OrPromise,
  type StatusListCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  type StatusListIndexingDirection,
  StatusListType,
  type StatusPurpose2021,
} from '@sphereon/ssi-types'
import type {
  CredentialPayload,
  IAgentContext,
  ICredentialIssuer,
  ICredentialPlugin,
  ICredentialVerifier,
  IKeyManager,
  IPluginMethodMap,
} from '@veramo/core'
import { DataSource } from 'typeorm'
import type { BitsPerStatus } from '@sd-jwt/jwt-status-list'
import type { SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc'
import type { StatusListOpts } from '@sphereon/oid4vci-common'
import { BitstringStatusPurpose } from '@4sure-tech/vc-bitstring-status-lists'

export enum StatusOAuth {
  Valid = 0,
  Invalid = 1,
  Suspended = 2,
}

export enum Status2021 {
  Valid = 0,
  Invalid = 1,
}

export type BitstringStatus = number

export type StatusList2021Args = {
  indexingDirection: StatusListIndexingDirection
  statusPurpose?: StatusPurpose2021
  // todo: validFrom and validUntil
}

export type OAuthStatusListArgs = {
  bitsPerStatus?: BitsPerStatus
  expiresAt?: Date
}

export type BitstringStatusListArgs = {
  statusPurpose: BitstringStatusPurpose
  bitsPerStatus: number
  ttl?: number
  validFrom?: Date
  validUntil?: Date
}

export type BaseCreateNewStatusListArgs = {
  type: StatusListType
  id: string
  issuer: string | IIssuer
  correlationId?: string
  length?: number
  proofFormat?: CredentialProofFormat
  keyRef?: string
  statusList2021?: StatusList2021Args
  oauthStatusList?: OAuthStatusListArgs
  bitstringStatusList?: BitstringStatusListArgs
  driverType?: StatusListDriverType
}

export type UpdateStatusList2021Args = {
  statusPurpose: StatusPurpose2021
}

export type UpdateOAuthStatusListArgs = {
  bitsPerStatus: BitsPerStatus
  expiresAt?: Date
}

export type UpdateBitstringStatusListArgs = {
  statusPurpose: BitstringStatusPurpose
  bitsPerStatus: number
  validFrom?: Date
  validUntil?: Date
  ttl?: number
}

export interface UpdateStatusListFromEncodedListArgs {
  type?: StatusListType
  statusListIndex: number | string
  value: number
  proofFormat?: CredentialProofFormat
  keyRef?: string
  correlationId?: string
  encodedList: string
  issuer: string | IIssuer
  id: string
  statusList2021?: UpdateStatusList2021Args
  oauthStatusList?: UpdateOAuthStatusListArgs
  bitstringStatusList?: UpdateBitstringStatusListArgs
}

export interface UpdateStatusListFromStatusListCredentialArgs {
  statusListCredential: StatusListCredential // | CompactJWT
  keyRef?: string
  statusListIndex: number | string
  value: number | Status2021 | StatusOAuth | BitstringStatus
}

export interface StatusListResult {
  encodedList: string
  statusListCredential: StatusListCredential
  length: number
  type: StatusListType
  proofFormat: CredentialProofFormat
  id: string
  statuslistContentType: string
  issuer: string | IIssuer
  statusList2021?: StatusList2021Details
  oauthStatusList?: OAuthStatusDetails
  bitstringStatusList?: BitstringStatusDetails

  // These cannot be deduced from the VC, so they are present when callers pass in these values as params
  correlationId?: string
  driverType?: StatusListDriverType
  credentialIdMode?: StatusListCredentialIdMode
}

interface StatusList2021Details {
  indexingDirection: StatusListIndexingDirection
  statusPurpose?: StatusPurpose2021
}

interface OAuthStatusDetails {
  bitsPerStatus?: BitsPerStatus
  expiresAt?: Date
}

interface BitstringStatusDetails {
  statusPurpose: BitstringStatusPurpose
  bitsPerStatus: number
  validFrom?: Date
  validUntil?: Date
  ttl?: number
}

export interface StatusList2021EntryCredentialStatus extends ICredentialStatus {
  type: 'StatusList2021Entry'
  statusPurpose: StatusPurpose2021
  statusListIndex: string
  statusListCredential: string
}

export interface StatusListOAuthEntryCredentialStatus extends ICredentialStatus {
  type: 'OAuthStatusListEntry'
  bitsPerStatus: number
  statusListIndex: string
  statusListCredential: string
  expiresAt?: Date
}

export interface BitstringStatusListEntryCredentialStatus extends ICredentialStatus {
  type: 'BitstringStatusListEntry'
  statusPurpose: BitstringStatusPurpose | BitstringStatusPurpose[]
  statusListIndex: string
  statusListCredential: string
  bitsPerStatus?: number
  statusMessage?: Array<BitstringStatus>
  statusReference?: string | string[]
}

export interface StatusList2021ToVerifiableCredentialArgs {
  issuer: string | IIssuer
  id: string
  type?: StatusListType
  proofFormat?: CredentialProofFormat
  keyRef?: string
  encodedList: string
  statusPurpose: StatusPurpose2021
}

export interface CreateStatusListArgs {
  issuer: string | IIssuer
  id: string
  proofFormat?: CredentialProofFormat
  keyRef?: string
  correlationId?: string
  length?: number
  statusList2021?: StatusList2021Args
  oauthStatusList?: OAuthStatusListArgs
  bitstringStatusList?: BitstringStatusListArgs
}

export interface UpdateStatusListIndexArgs {
  statusListCredential: StatusListCredential // | CompactJWT
  statusListIndex: number | string
  value: number | Status2021 | StatusOAuth | BitstringStatus
  bitsPerStatus?: number
  keyRef?: string
  expiresAt?: Date
}

export interface CheckStatusIndexArgs {
  statusListCredential: StatusListCredential // | CompactJWT
  statusListIndex: string | number
  bitsPerStatus?: number
}

export interface ToStatusListDetailsArgs {
  statusListPayload: StatusListCredential
  correlationId?: string
  driverType?: StatusListDriverType
  bitsPerStatus?: number
}

/**
 * The interface definition for a plugin that can add statuslist info to a credential
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @beta This API is likely to change without a BREAKING CHANGE notice
 */
export interface IStatusListPlugin extends IPluginMethodMap {
  /**
   * Create a new status list
   *
   * @param args Status list information like type and size
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - The details of the newly created status list
   */
  slCreateStatusList(args: CreateNewStatusListArgs, context: IRequiredContext): Promise<StatusListResult>

  /**
   * Ensures status list info like index and list id is added to a credential
   *
   * @param args - Arguments necessary to add the statuslist info.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the credential now with status support
   *
   * @beta This API is likely to change without a BREAKING CHANGE notice
   */
  slAddStatusToCredential(args: IAddStatusToCredentialArgs, context: IRequiredContext): Promise<CredentialWithStatusSupport>

  slAddStatusToSdJwtCredential(args: IAddStatusToSdJwtCredentialArgs, context: IRequiredContext): Promise<SdJwtVcPayload>

  /**
   * Get the status list using the configured driver for the SL. Normally a correlationId or id should suffice. Optionally accepts a dbName/datasource
   * @param args
   * @param context
   */
  slGetStatusList(args: GetStatusListArgs, context: IRequiredContext): Promise<StatusListResult>

  /**
   * Import status lists when noy yet present
   *
   * @param imports Array of status list information like type and size
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   */
  slImportStatusLists(imports: Array<CreateNewStatusListArgs>, context: IRequiredContext): Promise<boolean>
}

export type CreateNewStatusListFuncArgs = BaseCreateNewStatusListArgs

export type CreateNewStatusListArgs = BaseCreateNewStatusListArgs & {
  dbName?: string
  dataSource?: OrPromise<DataSource>
  isDefault?: boolean
}

export type IAddStatusToCredentialArgs = Omit<IIssueCredentialStatusOpts, 'dataSource'> & {
  credential: CredentialWithStatusSupport
}

export type IAddStatusToSdJwtCredentialArgs = Omit<IIssueCredentialStatusOpts, 'dataSource'> & {
  credential: SdJwtVcPayload
}

export interface IIssueCredentialStatusOpts {
  dataSource?: DataSource
  statusLists?: Array<StatusListOpts>
  credentialId?: string // An id to use for the credential. Normally should be set as the crdential.id value
  value?: string
}

export type GetStatusListArgs = {
  id?: string
  correlationId?: string
  dataSource?: OrPromise<DataSource>
  dbName?: string
}

export type CredentialWithStatusSupport = ICredential | CredentialPayload | IVerifiableCredential

export type SignedStatusListData = {
  statusListCredential: StatusListCredential
  encodedList: string
}

export type IRequiredPlugins = ICredentialPlugin & IIdentifierResolution
export type IRequiredContext = IAgentContext<ICredentialIssuer & ICredentialVerifier & IIdentifierResolution & IKeyManager & ICredentialPlugin>
