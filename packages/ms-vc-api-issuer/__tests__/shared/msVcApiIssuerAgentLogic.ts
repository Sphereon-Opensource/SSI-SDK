import { createAgent, TAgent , IDataStore, IDataStoreORM, VerifiableCredential, FindArgs, TCredentialColumns} from '@veramo/core'
import { IMsVcApiIssuer, IIssueRequest } from '../../src/types/IMsVcApiIssuer'
import { Entities, DataStore, DataStoreORM } from '@veramo/data-store'
import { createConnection } from 'typeorm'

type ConfiguredAgent = TAgent<IMsVcApiIssuer & IDataStore & IDataStoreORM >;
const did1 = 'did:test:111';
const did2 = 'did:test:222';

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('@sphereon/ms-vc-api-issuer', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should request issuance from Issuer', async () => {
      var requestConfigFile = '../../config/issuance_request_config.json';
      var issuanceConfig = require( requestConfigFile );
      var issuanceRequest : IIssueRequest = {
        authenticationInfo: {
          azClientId: '04c2bd60-cdbf-4935-80dd-110fdf473e6e',
          azClientSecret: 'WAM8Q~rE05C9ja2TRiZ3H~TYz2W4TdMe.jpwSc~p',
          azTenantId: 'e2a42b2f-7460-4499-afc2-425315ef058a',
          credentialManifestUrl: 'https://beta.eu.did.msidentity.com/v1.0/e2a42b2f-7460-4499-afc2-425315ef058a/verifiableCredential/contracts/VerifiedCredentialExpert2'
        },
        issuanceConfig: issuanceConfig
      }
      return await expect(
        agent.issuanceRequestMsVc(issuanceRequest)
      ).resolves.not.toBeNull()
    })

    it('should store credential and retrieve by id', async () => {

      const dbConnection = createConnection({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
        entities: Entities,
      })
      const localAgent = createAgent<IDataStore & IDataStoreORM >({
        plugins: [
          new DataStore(dbConnection),
          new DataStoreORM(dbConnection)        
        ],
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

      let result = await localAgent.dataStoreSaveVerifiableCredential({ verifiableCredential: vc5 })
      console.log('result: ' + result)

      const args: FindArgs<TCredentialColumns> = {
        where: [
          {
            column: 'id',
            value: ['vc5'],
          },
        ]
      }

      const credentials = await localAgent.dataStoreORMGetVerifiableCredentialsByClaims({})
      console.log('credentials: ' + credentials)
      expect(credentials[0].verifiableCredential.id).toEqual('vc5')
      const count = await localAgent.dataStoreORMGetVerifiableCredentialsCount(args)
      expect(count).toEqual(1)
    })

  })
}
