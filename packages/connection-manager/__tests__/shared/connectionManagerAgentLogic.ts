import { TAgent } from '@veramo/core'
import {
  ConnectionIdentifierEnum,
  IConnection,
  IConnectionParty,
  IOpenIdConfig
} from '../../src/types/IConnectionManager'
import { ConnectionTypeEnum } from '../../src/types/IConnectionManager'
import { IConnectionManager } from '../../src/types/IConnectionManager'

type ConfiguredAgent = TAgent<IConnectionManager>

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
}) => {
  describe('Connection Manager Agent Plugin', () => {
    let agent: ConfiguredAgent
    let defaultParty: IConnectionParty
    let defaultPartyConnection: IConnection

    const connection = {
      type: ConnectionTypeEnum.OPENID,
      identifier: {
        type: ConnectionIdentifierEnum.URL,
        correlationId: 'https://example.com'
      },
      config: {
        clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
        clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
        scopes: ['auth'],
        issuer: 'https://example.com/app-test',
        redirectUrl: 'app:/callback',
        dangerouslyAllowInsecureHttpRequests: true,
        clientAuthMethod: 'post' as const
      },
      metadata: [
        {
          label: 'Authorization URL',
          value: 'https://example.com'
        },
        {
          label: 'Scope',
          value: 'Authorization'
        }
      ]
    }

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      defaultParty = await agent.addParty({ name: 'default_party' })
      defaultPartyConnection = await agent.addConnection({ partyId: defaultParty.id!, connection })
      defaultParty = await agent.getParty({ partyId: defaultParty.id! })

      await agent.addConnection({ partyId: defaultParty.id!, connection })
    })

    afterAll(testContext.tearDown)

    it('should get party by id',async () => {
      const result = await agent.getParty({ partyId: defaultParty.id! })

      expect(result.id).toEqual(defaultParty.id)
    })

    it('should throw error when getting party and party is not found',async () => {
      const partyId = 'unknownPartyId'

      await expect(
          agent.getParty({ partyId })
      ).rejects.toThrow(`No party found for id: ${partyId}`)
    })

    it('should get all parties',async () => {
      const result = await agent.getParties()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add party',async () => {
      const partyName = 'new_party'

      const result = await agent.addParty({ name: partyName })

      expect(result.name).toEqual(partyName)
    })

    it('should throw error when adding party with duplicate name',async () => {
      const partyName = 'default_party'
      await expect(
        agent.addParty({ name: 'default_party' })
      ).rejects.toThrow(`Duplicate names are not allowed. Name: ${partyName}`)
    })

    it('should update party by id',async () => {
      const partyName = 'updated_party'
      const party = {
        ...defaultParty,
        name: partyName
      }

      const result = await agent.updateParty({ party })

      expect(result.name).toEqual(partyName)
    })

    it('should throw error when updating party and party is not found',async () => {
      const partyId = 'unknownPartyId'
      const party = {
        ...defaultParty,
        id: partyId,
        name: 'new_name'
      }
      await expect(
          agent.updateParty({ party })
      ).rejects.toThrow(`No party found for id: ${partyId}`)
    })

    it('should remove party by id and its connections',async () => {
      const removeParty = await agent.addParty({ name: 'remove_party' })
      const removePartyConnection = await agent.addConnection({ partyId: removeParty.id!, connection })

      const result = await agent.removeParty({ partyId: removeParty.id! })

      expect(result).toEqual(true)
      await expect(
          agent.getConnection({ connectionId: removePartyConnection.id! })
      ).rejects.toThrow(`No connection found for id: ${removePartyConnection.id!}`)
    })

    it('should get connection by id',async () => {
      const result = await agent.getConnection({ connectionId: defaultPartyConnection.id! })

      expect(result.id).toEqual(defaultPartyConnection.id)
    })

    it('should throw error when getting connection and connection is not found',async () => {
      const connectionId = 'b0b5b2f9-7d78-4533-8bc1-386e4f08dce1'

      await expect(
          agent.getConnection({
            connectionId,
          })
      ).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })

    it('should get all connections',async () => {
      const result = await agent.getConnections({ partyId: defaultParty.id! })

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add connection',async () => {
      const result = await agent.addConnection({ partyId: defaultParty.id!, connection })

      expect(result).not.toBeNull()
    })

    it('should update connection config by id',async () => {
      const clientSecret = '423af84c-bfb5-4605-bf6f-3b088d2ff0da'
      const connection = {
        ...defaultPartyConnection,
        config: {
          clientSecret,
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const
        }
      }

      const result = await agent.updateConnection({ connection })

      expect((result.config as IOpenIdConfig).clientSecret).toEqual(clientSecret)
    })

    it('should throw error when updating connection and connection is not found',async () => {
      const connectionId = 'unknownConnectionId'
      const connection = {
        ...defaultPartyConnection,
        id: connectionId,
        config: {
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const
        }
      }

      await expect(
          agent.updateConnection({ connection })
      ).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })

    it('should remove connection by id',async () => {
      const addedConnection = await agent.addConnection({ partyId: defaultParty.id!, connection })

      const result = await agent.removeConnection({connectionId: addedConnection.id!})

      expect(result).toEqual(true)
    })

    it('should throw error when removing connection and connection is not found',async () => {
      const connectionId = 'unknownConnectionId'

      await expect(
          agent.removeConnection({ connectionId })
      ).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })
  })
}
