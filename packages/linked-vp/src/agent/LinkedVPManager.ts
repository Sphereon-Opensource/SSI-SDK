import { DigitalCredential } from '@sphereon/ssi-sdk.data-store-types'
import { IAgentPlugin } from '@veramo/core'
import { IsNull, Not } from 'typeorm'
import { schema } from '../index'
import { createLinkedVPPresentation } from '../services/LinkedVPService'
import {
  GeneratePresentationArgs,
  GetServiceEntriesArgs,
  HasLinkedVPEntryArgs,
  ILinkedVPManager,
  LinkedVPEntry,
  LinkedVPPresentation,
  LinkedVPServiceEntry,
  PublishCredentialArgs,
  RequiredContext,
  UnpublishCredentialArgs,
} from '../types'

// Exposing the methods here for any REST implementation
export const linkedVPManagerMethods: Array<string> = [
  'lvpPublishCredential',
  'lvpUnpublishCredential',
  'lvpHasEntry',
  'lvpGetServiceEntries',
  'lvpGeneratePresentation',
]

/**
 * {@inheritDoc ILinkedVPManager}
 */
export class LinkedVPManager implements IAgentPlugin {
  readonly schema = schema.ILinkedVPManager
  readonly methods: ILinkedVPManager = {
    lvpPublishCredential: this.lvpPublishCredential.bind(this),
    lvpUnpublishCredential: this.lvpUnpublishCredential.bind(this),
    lvpHasEntry: this.lvpHasEntry.bind(this),
    lvpGetServiceEntries: this.lvpGetServiceEntries.bind(this),
    lvpGeneratePresentation: this.lvpGeneratePresentation.bind(this),
  }

  private readonly holderDids: Record<string, string>

  constructor(options: { holderDids: Record<string, string> }) {
    this.holderDids = options.holderDids
  }

  private async lvpPublishCredential(args: PublishCredentialArgs, context: RequiredContext): Promise<LinkedVPEntry> {
    const { digitalCredentialId } = args

    const credential: DigitalCredential = await context.agent.crsGetCredential({ id: digitalCredentialId })

    if (credential.linkedVpId) {
      return Promise.reject(new Error(`Credential ${digitalCredentialId} is already published with linkedVpId ${credential.linkedVpId}`))
    }

    const linkedVpId = this.buildLinkedVpId(args.linkedVpId, credential.tenantId)

    await this.ensureLinkedVpIdUnique(linkedVpId, context, credential.tenantId)

    const publishedAt = new Date()
    await context.agent.crsUpdateCredential({
      id: digitalCredentialId,
      linkedVpId,
      linkedVpFrom: publishedAt,
    })

    return {
      id: credential.id,
      linkedVpId,
      tenantId: credential.tenantId,
      linkedVpFrom: publishedAt,
      createdAt: credential.createdAt,
    }
  }

  private async lvpUnpublishCredential(args: UnpublishCredentialArgs, context: RequiredContext): Promise<boolean> {
    const { linkedVpId } = args

    // Find credential by linkedVpId and tenantId
    const credentials = await context.agent.crsGetCredentials({
      filter: [{ linkedVpId }],
    })
    if (credentials.length === 0) {
      return Promise.reject(Error(`No credential found with linkedVpId ${linkedVpId}`))
    }

    const credential = credentials[0]
    await context.agent.crsUpdateCredential({
      id: credential.id,
      linkedVpId: undefined,
      linkedVpFrom: undefined,
    })

    return true
  }

  private async lvpHasEntry(args: HasLinkedVPEntryArgs, context: RequiredContext): Promise<boolean> {
    const { linkedVpId } = args

    try {
      const credentials = await context.agent.crsGetCredentials({
        filter: [{ linkedVpId }],
      })
      return credentials.length > 0
    } catch (error) {
      return false
    }
  }

  private async lvpGetServiceEntries(args: GetServiceEntriesArgs, context: RequiredContext): Promise<Array<LinkedVPServiceEntry>> {
    const { tenantId } = args

    // Get all published credentials (credentials with linkedVpId set)
    const filter: any = { linkedVpId: Not(IsNull()) }
    if (tenantId) {
      filter.tenantId = tenantId
    }

    const credentials = await context.agent.crsGetCredentials({
      filter: [filter],
    })

    return credentials
      .filter((cred) => cred.linkedVpId !== undefined && cred.linkedVpId !== null)
      .map((cred) => {
        const holderDidForEntry = this.getHolderDid(cred.tenantId)
        return this.credentialToServiceEntry(cred, holderDidForEntry)
      })
  }

  private async lvpGeneratePresentation(args: GeneratePresentationArgs, context: RequiredContext): Promise<LinkedVPPresentation> {
    const { linkedVpId } = args
    const tenantId = this.parseTenantFromLinkedVpId(linkedVpId)
    const holderDid = this.getHolderDid(tenantId)

    const uniqueCredentials = await context.agent.crsGetUniqueCredentials({
      filter: [
        {
          linkedVpId: args.linkedVpId,
          ...(tenantId && { tenantId }),
        },
      ],
    })
    if (uniqueCredentials.length === 0) {
      return Promise.reject(Error(`No published credentials found for linkedVpId ${linkedVpId}`))
    }
    if (uniqueCredentials.length > 1) {
      return Promise.reject(Error(`Multiple credentials found for linkedVpId ${linkedVpId}`))
    }

    // Generate the Verifiable Presentation with all published credentials
    return createLinkedVPPresentation(holderDid, uniqueCredentials[0], context.agent)
  }

  private getHolderDid(tenantId: string | undefined) {
    const holderDid = this.holderDids[tenantId ?? 'default']
    if (!holderDid) {
      throw Error(`No holder did supplied for tenant ${tenantId ?? 'default'}`)
    }
    return holderDid
  }

  private parseTenantFromLinkedVpId(linkedVpId: string): string | undefined {
    const idx = linkedVpId.lastIndexOf('@')
    return idx === -1 ? undefined : linkedVpId.substring(idx + 1)
  }

  private generateLinkedVpId(): string {
    return `lvp-${Math.random().toString(36).substring(2, 15)}`
  }

  private async ensureLinkedVpIdUnique(linkedVpId: string, context: RequiredContext, tenantId?: string): Promise<void> {
    const credentials = await context.agent.crsGetCredentials({
      filter: [{ linkedVpId, ...(tenantId && { tenantId }) }],
    })

    if (credentials.length > 0) {
      throw new Error(`LinkedVP ID ${linkedVpId} already exists${tenantId ? ` for tenant ${tenantId}` : ''}`)
    }
  }

  private buildLinkedVpId(linkedVpId: string | undefined, tenantId: string | undefined) {
    let finalLinkedVpId = linkedVpId || this.generateLinkedVpId()

    // Append tenantId if provided and not already present
    if (tenantId && tenantId !== '' && !finalLinkedVpId.includes('@')) {
      finalLinkedVpId = `${finalLinkedVpId}@${tenantId}`
    }
    return finalLinkedVpId
  }

  private getBaseUrlFromDid(holderDid: string): string {
    if (!holderDid.startsWith('did:web:')) {
      throw new Error(`Invalid DID: ${holderDid}, must be did:web`)
    }

    const withoutPrefix = holderDid.replace('did:web:', '') // example.com:tenants:tenant1
    const parts = withoutPrefix.split(':')
    const domain = parts.shift()! // example.com
    const path = parts.join('/') // tenants/tenant1

    return path
      ? `https://${domain}/${path}` // https://example.com/tenants/tenant1
      : `https://${domain}` // https://example.com
  }

  private buildServiceEndpoint(holderDid: string, linkedVpId: string): string {
    const baseUrl = this.getBaseUrlFromDid(holderDid)
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${cleanBaseUrl}/linked-vp/${linkedVpId}`
  }

  private credentialToServiceEntry(credential: DigitalCredential, holderDid: string): LinkedVPServiceEntry {
    if (!credential.linkedVpId) {
      throw new Error(`Credential ${credential.id} does not have a linkedVpId`)
    }

    return {
      id: `${holderDid}#${credential.linkedVpId}`,
      type: 'LinkedVerifiablePresentation',
      serviceEndpoint: this.buildServiceEndpoint(holderDid, credential.linkedVpId),
    }
  }
}
