import { IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { ICredentialStore } from '@sphereon/ssi-sdk.credential-store'
import { VcdmCredentialPlugin } from '@sphereon/ssi-sdk.credential-vcdm'
import { ISDJwtPlugin } from '@sphereon/ssi-sdk.sd-jwt'
import { DocumentFormat } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { IKeyManager } from '@veramo/core/src/types/IKeyManager'

export const LOGGER_NAMESPACE = 'sphereon:linked-vp'

export type LinkedVPPresentation = {
  documentFormat: DocumentFormat
  presentationPayload: string | Record<string, any>
}

export interface ILinkedVPManager extends IPluginMethodMap {
  /**
   * Publish a credential as a LinkedVP by adding it to the holder's DID Document
   * @param args - Publication arguments including credential ID and scope configuration
   * @param context - Agent context
   */
  lvpPublishCredential(args: PublishCredentialArgs, context: RequiredContext): Promise<LinkedVPEntry>

  /**
   * Unpublish a credential by removing its LinkedVP entry from the DID Document
   * @param args - Unpublish arguments
   * @param context - Agent context
   */
  lvpUnpublishCredential(args: UnpublishCredentialArgs, context: RequiredContext): Promise<boolean>

  /**
   * Check if a LinkedVP entry exists by linkedVpId
   * @param args - Query arguments
   * @param context - Agent context
   */
  lvpHasEntry(args: HasLinkedVPEntryArgs, context: RequiredContext): Promise<boolean>

  /**
   * Get LinkedVP service entries for a DID to be added to a DID Document
   * This is useful when generating DID Documents with toDidDocument
   * @param args - Query arguments for the DID
   * @param context - Agent context
   */
  lvpGetServiceEntries(args: GetServiceEntriesArgs, context: RequiredContext): Promise<Array<LinkedVPServiceEntry>>

  /**
   * Generate and return a Verifiable Presentation for a published LinkedVP
   * This is the main endpoint handler for GET /linked-vp/{linkedVpId}
   * @param args - Generation arguments
   * @param context - Agent context
   */
  lvpGeneratePresentation(args: GeneratePresentationArgs, context: RequiredContext): Promise<LinkedVPPresentation>
}

export type PublishCredentialArgs = {
  digitalCredentialId: string
  linkedVpId?: string // Optional: if not provided, will be auto-generated
}

export type UnpublishCredentialArgs = {
  linkedVpId: string
}

export type HasLinkedVPEntryArgs = {
  linkedVpId: string
}

export type GetServiceEntriesArgs = {
  tenantId?: string
}

export type GeneratePresentationArgs = {
  linkedVpId: string
}

export type LinkedVPEntry = {
  id: string
  linkedVpId: string
  linkedVpFrom?: Date
  tenantId?: string
  createdAt: Date
}

export type LinkedVPServiceEntry = {
  id: string
  type: 'LinkedVerifiablePresentation'
  serviceEndpoint: string
}

export type RequiredContext = IAgentContext<IIdentifierResolution & ICredentialStore & IKeyManager & VcdmCredentialPlugin & ISDJwtPlugin>
