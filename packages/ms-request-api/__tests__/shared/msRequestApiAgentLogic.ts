import * as MsAuthenticator from '@sphereon/ms-authenticator'
import { fetchIssuanceRequestMs } from '../../src/IssuerUtil'
import { IMsRequestApi, IIssueRequestResponse, IClientIssueRequest, IClientIssuanceConfig } from '../../src/types/IMsRequestApi'
import { v4 as uuidv4 } from 'uuid'
import { createAgent, TAgent, IDataStore, IDataStoreORM, VerifiableCredential, FindArgs, TCredentialColumns } from '@veramo/core'
import { Entities, DataStore, DataStoreORM } from '@veramo/data-store'
import { createConnection } from 'typeorm'

type ConfiguredAgent = TAgent<IMsRequestApi & IDataStore & IDataStoreORM>
const did1 = 'did:test:111'
const did2 = 'did:test:222'
var requestIssuanceResponse: IIssueRequestResponse = {
  requestId: '2e5c6fae-218c-4c7b-8440-df5454f908e9',
  url: 'www.google.com',
  expiry: new Date(1655935606),
  id: 'fbef933e-f786-4b85-b1c8-6679346dc55d',
  pin: '3683',
}

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('@sphereon/ms-request-api', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      jest.mock('../../src/IssuerUtil', () => {
        return {
          fetchIssuanceRequestMs: jest.fn().mockResolvedValue(requestIssuanceResponse),
          generatePin: jest.fn().mockResolvedValue(6363),
        }
      })

      jest.mock('@sphereon/ms-authenticator', () => {
        return {
          ClientCredentialAuthenticator: jest.fn().mockResolvedValue('ey...'),
          checkMsIdentityHostname: jest.fn().mockResolvedValue(MsAuthenticator.MS_IDENTITY_HOST_NAME_EU),
        }
      })
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should request issuance from Issuer', async () => {
      var requestConfigFile = '../../config/issuance_request_config.json'
      var issuanceConfig: IClientIssuanceConfig = require(requestConfigFile)
      var clientIssueRequest: IClientIssueRequest = {
        authenticationInfo: {
          azClientId: 'AzClientID',
          azClientSecret: 'AzClientSecret',
          azTenantId: 'AzTenantId',
          credentialManifestUrl: 'CredentialManifestUrl',
        },
        clientIssuanceConfig: issuanceConfig,
        claims: {
          given_name: 'FIRSTNAME',
          family_name: 'LASTNAME',
        },
      }

      // modify the callback method to make it easier to debug
      // with tools like ngrok since the URI changes all the time
      // this way you don't need to modify the callback URL in the payload every time
      // ngrok changes the URI
      clientIssueRequest.clientIssuanceConfig.callback.url = `https://6270-2a02-a458-e71a-1-68b4-31d2-b44f-12b.eu.ngrok.io/api/issuer/issuance-request-callback`

      clientIssueRequest.clientIssuanceConfig.registration.clientName = 'Sphereon Node.js SDK API Issuer'

      // modify payload with new state, the state is used to be able to update the UI when callbacks are received from the VC Service
      var id = uuidv4()
      clientIssueRequest.clientIssuanceConfig.callback.state = id

      const fetchIssuanceRequestMsMock = jest.fn().mockResolvedValue(requestIssuanceResponse)
      fetchIssuanceRequestMs.prototype = fetchIssuanceRequestMsMock

      return await expect(agent.issuanceRequestMsVc(clientIssueRequest)).resolves.not.toBeNull
    })

    it('should store credential and retrieve by id', async () => {
      const dbConnection = createConnection({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
        entities: Entities,
      })
      const localAgent = createAgent<IDataStore & IDataStoreORM>({
        plugins: [new DataStore(dbConnection), new DataStoreORM(dbConnection)],
      })

      const vc5: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1323', 'https://www.w3.org/2020/demo/4342323'],
        type: ['VerifiableCredential', 'PublicProfile'],
        issuer: { id: did1 },
        issuanceDate: new Date().toISOString(),
        id: 'vc5',
        credentialSubject: {
          id: did2,
          name: 'Alice',
          profilePicture: 'https://example.com/a.png',
          address: {
            street: 'Some str.',
            house: 1,
          },
        },
        proof: {
          jwt: 'mockJWT',
        },
      }

      await localAgent.dataStoreSaveVerifiableCredential({ verifiableCredential: vc5 })

      const args: FindArgs<TCredentialColumns> = {
        where: [
          {
            column: 'id',
            value: ['vc5'],
          },
        ],
      }

      const credentials = await localAgent.dataStoreORMGetVerifiableCredentialsByClaims({})
      expect(credentials[0].verifiableCredential.id).toEqual('vc5')
      const count = await localAgent.dataStoreORMGetVerifiableCredentialsCount(args)
      expect(count).toEqual(1)
      await (await dbConnection).close()
    })
  })
}
