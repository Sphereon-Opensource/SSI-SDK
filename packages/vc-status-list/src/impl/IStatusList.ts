import { IAgentContext, ICredentialPlugin, ProofFormat } from '@veramo/core'
import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IIssuer, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { StatusListDetails, StatusListResult, UpdateStatusListFromEncodedListArgs } from '../types'

export interface IStatusList {
  /**
   * Creates a new status list of the specific type
   */
  createNewStatusList(
    args: {
      issuer: string | IIssuer
      id: string
      proofFormat?: ProofFormat
      keyRef?: string
      correlationId?: string
      length?: number
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListResult>

  /**
   * Updates a status at the given index in the status list
   */
  updateStatusListIndex(
    args: {
      statusListCredential: OriginalVerifiableCredential
      keyRef?: string
      statusListIndex: number | string
      value: boolean
    },
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListDetails>

  /**
   * Updates a status list using a base64 encoded list of statuses
   */
  updateStatusListFromEncodedList(
    args: UpdateStatusListFromEncodedListArgs,
    context: IAgentContext<ICredentialPlugin & IIdentifierResolution>,
  ): Promise<StatusListDetails>

  /**
   * Checks the status at a given index in the status list
   */
  checkStatusIndex(args: { statusListCredential: OriginalVerifiableCredential; statusListIndex: string | number }): Promise<boolean>
}
