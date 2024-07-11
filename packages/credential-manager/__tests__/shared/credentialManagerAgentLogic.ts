import { TAgent } from '@veramo/core'
import * as fs from 'fs'
import { CredentialCorrelationType, CredentialRole, CredentialStateType, DigitalCredential } from '@sphereon/ssi-sdk.data-store'
import {
  AddDigitalCredential,
  credentialIdOrHashFilter,
  DeleteCredentialsArgs,
  GetCredentialsArgs,
  ICredentialManager,
  UniqueDigitalCredential,
} from '../../src'
import { IVerifiableCredential } from '@sphereon/ssi-types'

type ConfiguredAgent = TAgent<ICredentialManager>

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Credential Manager Agent Plugin', (): void => {
    const exampleVC: IVerifiableCredential = getFileAsJson('./packages/credential-manager/__tests__/vc-examples/vc_driverLicense.json')

    let agent: ConfiguredAgent
    let defaultCredential: DigitalCredential

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      const digitalCredential: AddDigitalCredential = {
        credentialRole: CredentialRole.HOLDER,
        tenantId: 'test-tenant',
        issuerCorrelationId: 'did:example:the-issuer',
        issuerCorrelationType: CredentialCorrelationType.DID,
        rawDocument: JSON.stringify(exampleVC),
      }
      defaultCredential = await agent.crmAddCredential({ credential: digitalCredential })
    })

    afterAll(testContext.tearDown)

    it('should get credential item by id', async (): Promise<void> => {
      const result = await agent.crmGetCredential({ id: defaultCredential.id })
      expect(result.id).toEqual(defaultCredential.id)
    })

    it('should throw error when getting credential item with unknown id', async (): Promise<void> => {
      const itemId = 'unknownId'
      await expect(agent.crmGetCredential({ id: itemId })).rejects.toThrow(`No credential found for arg: {\"id\":\"${itemId}\"}`)
    })

    it('should get credential items by filter', async (): Promise<void> => {
      const args: GetCredentialsArgs = {
        filter: [
          {
            credentialRole: CredentialRole.HOLDER,
          },
        ],
      }
      const result: Array<DigitalCredential> = await agent.crmGetCredentials(args)

      expect(result.length).toBe(1)
    })

    it('should get credential items by id or hash', async (): Promise<void> => {
      const args1: GetCredentialsArgs = {
        filter: [
          {
            id: defaultCredential.id,
          },
        ],
      }
      const result1: Array<DigitalCredential> = await agent.crmGetCredentials(args1)
      expect(result1.length).toBe(1)

      const args2: GetCredentialsArgs = {
        filter: [
          {
            hash: defaultCredential.hash,
          },
        ],
      }
      const result2: Array<DigitalCredential> = await agent.crmGetCredentials(args2)
      expect(result2.length).toBe(1)

      const args3: GetCredentialsArgs = {
        filter: [
          {
            id: defaultCredential.id,
          },
          {
            hash: defaultCredential.hash,
          },
        ],
      }
      const result3: Array<DigitalCredential> = await agent.crmGetCredentials(args3)
      expect(result3.length).toBe(1)

      const args4: GetCredentialsArgs = {
        filter: [
          {
            id: 'another_id',
          },
          {
            hash: defaultCredential.hash,
          },
        ],
      }
      const result4: Array<DigitalCredential> = await agent.crmGetCredentials(args4)
      expect(result4.length).toBe(1)
    })

    it('should get unique credential by id or hash', async (): Promise<void> => {
      const result: Array<UniqueDigitalCredential> = await agent.crmGetUniqueCredentials({ filter: credentialIdOrHashFilter(defaultCredential.hash) })
      expect(result.length).toBe(1)
      expect(result[0].hash).toEqual(defaultCredential.hash)
      expect(result[0].digitalCredential.id).toEqual(defaultCredential.id)
      expect(result[0].digitalCredential.hash).toEqual(defaultCredential.hash)
    })

    it('should update credential by id', async (): Promise<void> => {
      const revokeUpdate = {
        id: defaultCredential.id,
        verifiedState: CredentialStateType.REVOKED,
        revokedAt: new Date(),
      }
      const result: DigitalCredential = await agent.crmUpdateCredentialState(revokeUpdate)

      expect(result.verifiedState).toEqual(revokeUpdate.verifiedState)
      expect(result.revokedAt).toEqual(revokeUpdate.revokedAt)
    })

    it('should delete credential by id', async (): Promise<void> => {
      const result = await agent.crmDeleteCredential({ id: defaultCredential.id })

      expect(result).toBe(true)
    })

    it('should throw error when deleting credential with unknown id', async (): Promise<void> => {
      const id = 'unknownId'
      const result = await agent.crmDeleteCredential({ id })
      expect(result).toBe(false)
    })

    it('should delete multiple credential items by filter', async (): Promise<void> => {
      const digitalCredential1: AddDigitalCredential = {
        credentialRole: CredentialRole.VERIFIER,
        tenantId: 'test-tenant',
        issuerCorrelationId: 'did:example:item1',
        issuerCorrelationType: CredentialCorrelationType.DID,
        rawDocument: JSON.stringify(exampleVC),
      }
      await agent.crmAddCredential({ credential: digitalCredential1 })

      const exampleVC2: IVerifiableCredential = { ...exampleVC }
      ;(exampleVC2.credentialSubject as any).extraField = 'Extra extra'
      const digitalCredential2: AddDigitalCredential = {
        credentialRole: CredentialRole.VERIFIER,
        tenantId: 'test-tenant',
        issuerCorrelationId: 'did:example:item2',
        issuerCorrelationType: CredentialCorrelationType.DID,
        rawDocument: JSON.stringify(exampleVC2),
      }
      await agent.crmAddCredential({ credential: digitalCredential2 })

      const args: DeleteCredentialsArgs = {
        filter: [
          {
            credentialRole: CredentialRole.VERIFIER,
            tenantId: 'test-tenant',
          },
        ],
      }
      const deleteCount = await agent.crmDeleteCredentials(args)
      expect(deleteCount).toBe(2)
    })
  })
}
