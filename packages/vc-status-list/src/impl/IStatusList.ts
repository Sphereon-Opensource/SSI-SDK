import type { IAgentContext, ICredentialPlugin } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import {
  BitstringStatus,
  BitstringStatusListEntryCredentialStatus,
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  Status2021,
  StatusList2021EntryCredentialStatus,
  StatusListOAuthEntryCredentialStatus,
  StatusListResult,
  StatusOAuth,
  ToStatusListDetailsArgs,
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
import { IBitstringStatusListEntryEntity, IStatusListEntryEntity, StatusListEntity } from '@sphereon/ssi-sdk.data-store'

export interface IStatusList {
  /**
   * Creates a new status list of the specific type
   */
  createNewStatusList(args: CreateStatusListArgs, context: IAgentContext<ICredentialPlugin & IIdentifierResolution>): Promise<StatusListResult>

  /**
   * Updates a status at the given index in the status list
   */
  updateStatusListIndex(args: UpdateStatusListIndexArgs, context: IAgentContext<ICredentialPlugin & IIdentifierResolution>): Promise<StatusListResult>

  /**
   * Updates a status list using a base64 encoded list of statuses
   */
  updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult>

  /**
   * Checks the status at a given index in the status list
   */
  checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | Status2021 | StatusOAuth | BitstringStatus>

  /**
   * Collects the status list details - returns flattened entity data ready for storage
   */
  toStatusListDetails(
    args: ToStatusListDetailsArgs,
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
