import { TAgent } from '@veramo/core'
import { IOID4VCIRestClient } from '../../src'

type ConfiguredAgent = TAgent<IOID4VCIRestClient>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('ssi-sdk.oid4vci-issuer-rest-client', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })
    afterAll(async () => {
      await testContext.tearDown()
    })

    // fixme: bring this test back
    it.skip('should create the url Offer Url with baseUrl', async () => {
      const result = await agent.oid4vciClientCreateOfferUri({
        agentBaseUrl: 'https://ssi-backend.sphereon.com',
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': '1234',
          },
        },
        credential_configuration_ids: ['dbc2023'],
        credential_issuer: 'https://dbc2023.test.sphereon.com/issuer/dbc2023',
      })
      expect(result).toEqual({
        uri: 'openid-credential-offer://?credential_offer=%7B%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%221234%22%2C%22user_pin_required%22%3Afalse%7D%7D%2C%22credentials%22%3A%5B%22dbc2023%22%5D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fdbc2023.test.sphereon.com%2Fissuer%2Fdbc2023%22%7D',
      })
    })

    // fixme: bring this test back
    it.skip('should create the url Offer Url without baseUrl', async () => {
      const result = await agent.oid4vciClientCreateOfferUri({
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': '1234',
          },
        },
        credential_configuration_ids: ['dbc2023'],
        credential_issuer: 'https://dbc2023.test.sphereon.com/issuer/dbc2023',
      })
      expect(result).toEqual({
        uri: 'openid-credential-offer://?credential_offer=%7B%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%221234%22%2C%22user_pin_required%22%3Afalse%7D%7D%2C%22credentials%22%3A%5B%22dbc2023%22%5D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fdbc2023.test.sphereon.com%2Fissuer%2Fdbc2023%22%7D',
      })
    })
  })
}
