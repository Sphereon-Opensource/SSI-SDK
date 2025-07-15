import type { IAgentContext } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  IMergeDetailsWithEntityArgs,
  IToDetailsFromCredentialArgs,
  Status2021,
  StatusList2021EntryCredentialStatus,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
  StatusOAuth,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'
import { BitstringStatusPurpose } from '@4sure-tech/vc-bitstring-status-lists'
import {
  CredentialProofFormat,
  IIssuer,
  StatusListCredential,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
} from '@sphereon/ssi-types'
import {
  BitstringStatusListEntryCredentialStatus,
  IBitstringStatusListEntryEntity,
  IStatusListEntryEntity,
  StatusListEntity,
} from '@sphereon/ssi-sdk.data-store'
import { IVcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { DecodedStatusListPayload } from './encoding/common'

export interface IExtractedCredentialDetails {
  id: string
  issuer: string | IIssuer
  encodedList: string
  decodedPayload?: DecodedStatusListPayload
}

export interface IStatusList {
  /**
   * Creates a new status list of the specific type
   */
  createNewStatusList(args: CreateStatusListArgs, context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>): Promise<StatusListResult>

  /**
   * Updates a status at the given index in the status list
   */
  updateStatusListIndex(
    args: UpdateStatusListIndexArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult>

  /**
   * Updates a status list using a base64 encoded list of statuses
   */
  updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<IVcdmCredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult>

  /**
   * Checks the status at a given index in the status list
   */
  checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | Status2021 | StatusOAuth>

  /**
   * Performs the initial parsing of a StatusListCredential.
   * This method handles expensive operations like JWT/CWT decoding once.
   * It extracts all details available from the credential payload itself.
   */
  extractCredentialDetails(credential: StatusListCredential): Promise<IExtractedCredentialDetails>

  /**
   * Converts a credential and its known metadata into a full StatusListResult.
   */
  toStatusListDetails(
    args: IToDetailsFromCredentialArgs,
  ): Promise<
    StatusListResult & (IStatusList2021ImplementationResult | IOAuthStatusListImplementationResult | IBitstringStatusListImplementationResult)
  >

  /**
   * Merges pre-parsed details from a new credential with an existing database entity.
   */
  toStatusListDetails(
    args: IMergeDetailsWithEntityArgs,
  ): Promise<
    StatusListResult & (IStatusList2021ImplementationResult | IOAuthStatusListImplementationResult | IBitstringStatusListImplementationResult)
  >

  /**
   * Creates a credential status object from a status list and entry
   */
  createCredentialStatus(args: {
    statusList: StatusListEntity
    statusListEntry: IStatusListEntryEntity | IBitstringStatusListEntryEntity
    statusListIndex: number
  }): Promise<StatusList2021EntryCredentialStatus | StatusListOAuthEntryCredentialStatus | BitstringStatusListEntryCredentialStatus>
}

export interface IStatusListImplementationResult {
  id: string
  encodedList: string
  issuer: string | IIssuer
  type: StatusListType
  proofFormat: CredentialProofFormat
  length: number
  statusListCredential: StatusListCredential
  statuslistContentType: string
  correlationId?: string
  driverType?: StatusListDriverType
}

export interface IStatusList2021ImplementationResult extends IStatusListImplementationResult {
  type: StatusListType.StatusList2021
  indexingDirection: StatusListIndexingDirection
  statusPurpose: StatusPurpose2021
}

export interface IOAuthStatusListImplementationResult extends IStatusListImplementationResult {
  type: StatusListType.OAuthStatusList
  bitsPerStatus: number
  expiresAt?: Date
}

export interface IBitstringStatusListImplementationResult extends IStatusListImplementationResult {
  type: StatusListType.BitstringStatusList
  statusPurpose: BitstringStatusPurpose | BitstringStatusPurpose[]
  bitsPerStatus?: number
  validFrom?: Date
  validUntil?: Date
  ttl?: number
}
