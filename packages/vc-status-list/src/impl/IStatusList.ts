import type { IAgentContext, ICredentialPlugin } from '@veramo/core'
import type { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import type {
  CheckStatusIndexArgs,
  CreateStatusListArgs,
  Status2021,
  StatusListResult,
  StatusOAuth,
  ToStatusListDetailsArgs,
  UpdateStatusListFromEncodedListArgs,
  UpdateStatusListIndexArgs,
} from '../types'

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
  checkStatusIndex(args: CheckStatusIndexArgs): Promise<number | Status2021 | StatusOAuth>

  /**
   * Collects the status list details
   */
  toStatusListDetails(args: ToStatusListDetailsArgs): Promise<StatusListResult>
}
