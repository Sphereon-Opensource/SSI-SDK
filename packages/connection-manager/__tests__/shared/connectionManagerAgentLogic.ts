import { TAgent } from '@veramo/core'
import { IConnectionManager } from '../../src/types/IConnectionManager'
import {
  ConnectionIdentifierEnum,
  ConnectionTypeEnum,
  IBasicConnection,
  IConnection,
  IConnectionParty,
  IOpenIdConfig,
} from '@sphereon/ssi-sdk-data-store-common'

type ConfiguredAgent = TAgent<IConnectionManager>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('Connection Manager Agent Plugin', () => {
    let agent: ConfiguredAgent
    let defaultParty: IConnectionParty
    let defaultPartyConnection: IConnection

    const connection: IBasicConnection = {
      type: ConnectionTypeEnum.OPENID,
      identifier: {
        type: ConnectionIdentifierEnum.URL,
        correlationId: 'https://example.com',
      },
      config: {
        clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
        clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
        scopes: ['auth'],
        issuer: 'https://example.com/app-test',
        redirectUrl: 'app:/callback',
        dangerouslyAllowInsecureHttpRequests: true,
        clientAuthMethod: 'post' as const,
      },
      metadata: [
        {
          label: 'Authorization URL',
          value: 'https://example.com',
        },
        {
          label: 'Scope',
          value: 'Authorization',
        },
      ],
    }

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      defaultParty = await agent.cmAddParty({ name: 'default_party' })
      defaultPartyConnection = await agent.cmAddConnection({ partyId: defaultParty.id!, connection })
      defaultParty = await agent.cmGetParty({ partyId: defaultParty.id! })

      await agent.cmAddConnection({ partyId: defaultParty.id!, connection })
    })

    afterAll(testContext.tearDown)

    it('should get party by id', async () => {
      const result = await agent.cmGetParty({ partyId: defaultParty.id! })

      expect(result.id).toEqual(defaultParty.id)
    })

    it('should throw error when getting party and party is not found', async () => {
      const partyId = 'unknownPartyId'

      await expect(agent.cmGetParty({ partyId })).rejects.toThrow(`No party found for id: ${partyId}`)
    })

    it('should get all parties', async () => {
      const result = await agent.cmGetParties()

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add party', async () => {
      const partyName = 'new_party'

      const result = await agent.cmAddParty({ name: partyName })

      expect(result.name).toEqual(partyName)
    })

    it('should throw error when adding party with duplicate name', async () => {
      const partyName = 'default_party'
      await expect(agent.cmAddParty({ name: 'default_party' })).rejects.toThrow(`Duplicate names are not allowed. Name: ${partyName}`)
    })

    it('should update party by id', async () => {
      const partyName = 'updated_party'
      const party = {
        ...defaultParty,
        name: partyName,
      }

      const result = await agent.cmUpdateParty({ party })

      expect(result.name).toEqual(partyName)
    })

    it('should throw error when updating party and party is not found', async () => {
      const partyId = 'unknownPartyId'
      const party = {
        ...defaultParty,
        id: partyId,
        name: 'new_name',
      }
      await expect(agent.cmUpdateParty({ party })).rejects.toThrow(`No party found for id: ${partyId}`)
    })

    it('should remove party by id and its relations', async () => {
      const removeParty = await agent.cmAddParty({ name: 'remove_party' })
      const removePartyConnection = await agent.cmAddConnection({ partyId: removeParty.id!, connection })

      const result = await agent.cmRemoveParty({ partyId: removeParty.id! })

      expect(result).toEqual(true)
      await expect(agent.cmGetParty({ partyId: removeParty.id! })).rejects.toThrow(`No party found for id: ${removeParty.id!}`)
      await expect(agent.cmGetConnection({ connectionId: removePartyConnection.id! })).rejects.toThrow(
        `No connection found for id: ${removePartyConnection.id!}`
      )
    })

    it('should get connection by id', async () => {
      const result = await agent.cmGetConnection({ connectionId: defaultPartyConnection.id! })

      expect(result.id).toEqual(defaultPartyConnection.id)
    })

    it('should throw error when getting connection and connection is not found', async () => {
      const connectionId = 'b0b5b2f9-7d78-4533-8bc1-386e4f08dce1'

      await expect(
        agent.cmGetConnection({
          connectionId,
        })
      ).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })

    it('should get all connections', async () => {
      const result = await agent.cmGetConnections({ partyId: defaultParty.id! })

      expect(result.length).toBeGreaterThan(0)
    })

    it('should add connection', async () => {
      const result = await agent.cmAddConnection({ partyId: defaultParty.id!, connection })

      expect(result).not.toBeNull()
    })

    it('should update connection config by id', async () => {
      const clientSecret = '423af84c-bfb5-4605-bf6f-3b088d2ff0da'
      const connection = {
        ...defaultPartyConnection,
        config: {
          id: '25a619ee-d93e-44ae-8355-ab50d18af8bd',
          clientSecret,
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const,
        },
      }

      const result = await agent.cmUpdateConnection({ connection })

      expect((result.config as IOpenIdConfig).clientSecret).toEqual(clientSecret)
    })

    it('should throw error when updating connection and connection is not found', async () => {
      const connectionId = 'unknownConnectionId'
      const connection = {
        ...defaultPartyConnection,
        id: connectionId,
        config: {
          id: '25a619ee-d93e-44ae-8355-ab50d18af8bd',
          clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
          clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
          scopes: ['auth'],
          issuer: 'https://example.com/app-test',
          redirectUrl: 'app:/callback',
          dangerouslyAllowInsecureHttpRequests: true,
          clientAuthMethod: 'post' as const,
        },
      }

      await expect(agent.cmUpdateConnection({ connection })).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })

    it('should remove connection by id and its relations', async () => {
      const addedConnection = await agent.cmAddConnection({ partyId: defaultParty.id!, connection })

      const result = await agent.cmRemoveConnection({ connectionId: addedConnection.id! })

      expect(result).toEqual(true)
      //TODO add relation checks
      await expect(agent.cmGetConnection({ connectionId: addedConnection.id! })).rejects.toThrow(`No connection found for id: ${addedConnection.id!}`)
    })

    it('should throw error when removing connection and connection is not found', async () => {
      const connectionId = 'unknownConnectionId'

      await expect(agent.cmRemoveConnection({ connectionId })).rejects.toThrow(`No connection found for id: ${connectionId}`)
    })

    it('should succeed adding a default connection', async () => {
      let parties = await agent.cmGetParties()
      const origSize = parties.length

      const sphereonName = 'Sphereon'
      const sphereon = parties.find((party: IConnectionParty) => party.name === sphereonName)
      if (!sphereon) {
        await agent.cmAddParty({ name: sphereonName }).then(async (party: IConnectionParty) => {
          if (!party) {
            return
          }

          const connection = {
            type: ConnectionTypeEnum.OPENID,
            identifier: {
              type: ConnectionIdentifierEnum.URL,
              correlationId: 'https://auth-test.sphereon.com/auth/realms/ssi-wallet',
            },
            config: {
              clientId: 'ssi-wallet',
              clientSecret: '45de05ae-fefb-49a9-962d-46905df7ed65',
              issuer: 'https://auth-test.sphereon.com/auth/realms/ssi-wallet',
              serviceConfiguration: {
                authorizationEndpoint: 'https://auth-test.sphereon.com/auth/realms/ssi-wallet/protocol/openid-connect/auth',
                tokenEndpoint: 'https://auth-test.sphereon.com/auth/realms/ssi-wallet/protocol/openid-connect/token',
              },
              redirectUrl: 'com.sphereon.ssi.wallet:/callback',
              dangerouslyAllowInsecureHttpRequests: true,
              clientAuthMethod: 'post' as const,
              scopes: ['openid'],
            },
            metadata: [
              {
                label: 'Connection URL',
                value: 'https://auth-test.sphereon.com',
              },
            ],
          }
          await agent.cmAddConnection({ partyId: party.id, connection })
        })
      }

      parties = await agent.cmGetParties()
      expect(parties.length).toEqual(origSize + 1)
    })
  })
}
