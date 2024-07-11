import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialRole, DigitalCredential, UpdateCredentialStateArgs } from '@sphereon/ssi-sdk.data-store'
import { FindDigitalCredentialArgs } from '@sphereon/ssi-sdk.data-store/dist/types/digitalCredential/IAbstractDigitalCredentialStore'
import { NonPersistedDigitalCredential } from '@sphereon/ssi-sdk.data-store/dist/types/digitalCredential/digitalCredential'
import { FindClaimsArgs } from './claims'
import { ICredential, IPresentation, IVerifiableCredential, OriginalVerifiableCredential, OriginalVerifiablePresentation } from '@sphereon/ssi-types'

export interface ICredentialManager extends IPluginMethodMap {
  /**
   * Add a new credential.
   * @param args
   */
  crmAddCredential(args: AddCredentialArgs): Promise<DigitalCredential>

  /**
   * Update credential the state of an existing credential.
   * @param args
   */
  crmUpdateCredentialState(args: UpdateCredentialStateArgs): Promise<DigitalCredential>

  /**
   * Get a single credentials by primary key
   * @param args
   */
  crmGetCredential(args: GetCredentialArgs): Promise<DigitalCredential>

  /**
   * Find one or more credentials using filters
   * @param args
   */
  crmGetCredentials(args: GetCredentialsArgs): Promise<Array<DigitalCredential>>

  /**
   * Find one or more credentials using filters
   * @param args
   */
  crmGetUniqueCredentials(args: GetCredentialsArgs): Promise<Array<UniqueDigitalCredential>>

  /**
   * Find one credential by id or hash
   * @param CredentialRole
   * @param idOrHash
   */
  crmGetUniqueCredentialByIdOrHash(args: GetCredentialsByIdOrHashArgs): Promise<OptionalUniqueDigitalCredential>

  /**
   * Returns a list of UniqueDigitalCredentials that match the given filter based on the claims they contain.
   * @param args
   */
  crmGetCredentialsByClaims(args: GetCredentialsByClaimsArgs): Promise<Array<UniqueDigitalCredential>>

  /**
   * Returns a count of UniqueDigitalCredentials that match the given filter based on the claims they contain.
   * @param args
   */
  crmGetCredentialsByClaimsCount(args: GetCredentialsByClaimsArgs): Promise<number>

  /**
   * Delete a single credentials by primary key
   * @param args
   */
  crmDeleteCredential(args: DeleteCredentialArgs): Promise<boolean>

  /**
   * Delete multiple credentials records using filters
   * @param args
   */
  crmDeleteCredentials(args: DeleteCredentialsArgs): Promise<number>
}

export type GetCredentialArgs = {
  id: string
}

export type GetCredentialsArgs = {
  filter: FindDigitalCredentialArgs
}

export type GetCredentialsByClaimsArgs = {
  filter: FindClaimsArgs
  credentialRole?: CredentialRole
  tenantId?: string
}

export type GetCredentialsByIdOrHashArgs = {
  credentialRole: CredentialRole
  idOrHash: string
}

export type DeleteCredentialArgs = {
  id: string
}

export type DeleteCredentialsArgs = GetCredentialsArgs

export type AddDigitalCredential = Omit<
  NonPersistedDigitalCredential,
  'id' | 'documentType' | 'documentFormat' | 'uniformDocument' | 'hash' | 'createdAt' | 'lastUpdatedAt' | 'validFrom' | 'validUntil'
>

export type AddCredentialArgs = {
  credential: AddDigitalCredential
}

export type { UpdateCredentialStateArgs } from '@sphereon/ssi-sdk.data-store' // TODO create a local copy?

export interface UniqueDigitalCredential {
  hash: string
  digitalCredential: DigitalCredential

  originalVerifiableCredential?: OriginalVerifiableCredential
  originalVerifiablePresentation?: OriginalVerifiablePresentation
  originalCredential?: ICredential
  originalPresentation?: IPresentation
  uniformVerifiableCredential?: IVerifiableCredential
  uniformVerifiablePresentation?: IVerifiableCredential
}

export type OptionalUniqueDigitalCredential = UniqueDigitalCredential | undefined

export type RequiredContext = IAgentContext<never>
