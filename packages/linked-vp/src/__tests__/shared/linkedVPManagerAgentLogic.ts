import { CredentialRole } from '@sphereon/ssi-types'
import { TAgent } from '@veramo/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ILinkedVPManager } from '../../index'

type ConfiguredAgent = TAgent<ILinkedVPManager>

const holderDid = 'did:web:example.com'
const tenantId = 'tenant1'
const holderDidWithTenant = 'did:web:example.com:tenants:tenant1'

function createMockVC(typeSuffix: string) {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', typeSuffix],
    issuer: 'did:web:issuer.com',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: holderDid,
      value: `value-${Math.random().toString(36).slice(2)}`,
    },
  }
}

async function createTestCredential(agent: ConfiguredAgent, tenantId: string) {
  const mockVC = createMockVC('TestCredential')

  const created = await agent.crsAddCredential({
    credential: {
      credentialRole: CredentialRole.HOLDER,
      rawDocument: JSON.stringify(mockVC),
      issuerCorrelationType: 'DID',
      issuerCorrelationId: 'did:web:issuer.com',
      kmsKeyRef: 'mock-key-ref',
      identifierMethod: 'did:web',
      tenantId,
    },
  })

  return created.id
}

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}): void => {
  describe('LinkedVP Manager Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should publish credential with auto-generated linkedVpId INCLUDING tenant suffix', async () => {
      const credentialId = await createTestCredential(agent, tenantId)

      const result = await agent.lvpPublishCredential({
        digitalCredentialId: credentialId,
      })

      expect(result.linkedVpId).toMatch(/^lvp-[a-z0-9]+@tenant1$/)
    })

    it('should publish credential with custom linkedVpId AND append tenantId', async () => {
      const credentialId = await createTestCredential(agent, tenantId)
      const customLinkedVpId = 'my-custom-lvp-id'

      const result = await agent.lvpPublishCredential({
        digitalCredentialId: credentialId,
        linkedVpId: customLinkedVpId,
      })

      expect(result.linkedVpId).toBe('my-custom-lvp-id@tenant1')
    })

    it('should fail to publish already published credential', async () => {
      const credentialId = await createTestCredential(agent, tenantId)
      const linkedVpId = 'already-published'

      await agent.lvpPublishCredential({
        digitalCredentialId: credentialId,
        linkedVpId,
      })

      await expect(
        agent.lvpPublishCredential({
          digitalCredentialId: credentialId,
          linkedVpId: 'different-id',
        }),
      ).rejects.toThrow(/already published/)
    })

    it('should fail to publish duplicate linkedVpId (after tenant appending)', async () => {
      const cred1 = await createTestCredential(agent, tenantId)
      const cred2 = await createTestCredential(agent, tenantId)
      const duplicateId = 'duplicate-lvp-id'

      await agent.lvpPublishCredential({ digitalCredentialId: cred1, linkedVpId: duplicateId })

      await expect(
        agent.lvpPublishCredential({
          digitalCredentialId: cred2,
          linkedVpId: duplicateId,
        }),
      ).rejects.toThrow(/already exists/)
    })

    it('should unpublish a credential', async () => {
      const credentialId = await createTestCredential(agent, tenantId)
      const linkedVpId = 'to-be-unpublished'

      await agent.lvpPublishCredential({
        digitalCredentialId: credentialId,
        linkedVpId,
      })

      const result = await agent.lvpUnpublishCredential({
        linkedVpId: `${linkedVpId}@tenant1`,
      })

      expect(result).toBe(true)
    })

    it('should get service entries for default tenant (no tenantId param)', async () => {
      // Clean up any existing published credentials first
      const existingEntries = await agent.lvpGetServiceEntries({})
      for (const entry of existingEntries) {
        const linkedVpId = entry.id.split('#')[1]
        await agent.lvpUnpublishCredential({ linkedVpId }).catch(() => {
          // Ignore errors if already unpublished
        })
      }

      const id1 = await createTestCredential(agent, tenantId)
      const id2 = await createTestCredential(agent, tenantId)

      await agent.lvpPublishCredential({ digitalCredentialId: id1, linkedVpId: 'service1' })
      await agent.lvpPublishCredential({ digitalCredentialId: id2, linkedVpId: 'service2' })

      const entries = await agent.lvpGetServiceEntries({})

      expect(entries).toHaveLength(2)
      expect(entries).toEqual(
        expect.arrayContaining([
          {
            id: `${holderDid}#service1@tenant1`,
            type: 'LinkedVerifiablePresentation',
            serviceEndpoint: `https://example.com/linked-vp/service1@tenant1`,
          },
          {
            id: `${holderDid}#service2@tenant1`,
            type: 'LinkedVerifiablePresentation',
            serviceEndpoint: `https://example.com/linked-vp/service2@tenant1`,
          },
        ]),
      )
    })

    /* TODO, did:web may be complicated in a test
    it('should generate presentation for published credentials', async () => {
      const credentialId = await createTestCredential(agent, tenantId)
      const baseId = 'presentation-test'

      await agent.lvpPublishCredential({
        digitalCredentialId: credentialId,
        linkedVpId: baseId,
      })

      const fullLinkedVpId = `${baseId}@tenant1`

      const vp = await agent.lvpGeneratePresentation({ linkedVpId: fullLinkedVpId })
      expect(vp).toBeDefined()
    })*/
  })
}
