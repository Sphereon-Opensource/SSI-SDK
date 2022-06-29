import { TAgent, VerifiableCredential, FindArgs, TCredentialColumns} from '@veramo/core'
import { IVcManager } from '../../src/types/IVcManager'

type ConfiguredAgent = TAgent<IVcManager>
const did1 = 'did:test:111';
const did2 = 'did:test:222';

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
}) => {
  describe('VC Manager Agent Plugin', () => {
    let agent: ConfiguredAgent
    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should store credential and retrieve by id', async () => {
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

      await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: vc5 })

      const args: FindArgs<TCredentialColumns> = {
        where: [
          {
            column: 'id',
            value: ['vc5'],
          },
        ],
        order: [{ column: 'issuanceDate', direction: 'DESC' }],
      }

      const credentials = await agent.dataStoreORMGetVerifiableCredentials(args)
      expect(credentials[0].verifiableCredential.id).toEqual('vc5')
      const count = await agent.dataStoreORMGetVerifiableCredentialsCount(args)
      expect(count).toEqual(1)
    })
  })
}
