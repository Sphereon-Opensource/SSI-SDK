import { createAgent, IResolver } from '@veramo/core'
// @ts-ignore
import nock from 'nock'
import { IOID4VCIRestClient, OID4VCIRestClient } from '../src'

const baseUrl = 'https://my-vci-endpoint'

const agent = createAgent<IResolver & IOID4VCIRestClient>({
  plugins: [new OID4VCIRestClient({ baseUrl })],
})
afterAll(() => {
  nock.cleanAll()
})

describe('@sphereon/ssi-sdk.oid4vci-rest-client', () => {
  it('should call the mock endpoint for vciClientCreateOfferUri', async () => {
    nock(`${baseUrl}/webapp/`).post(`/credential-offers`, {
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': '1234',
          user_pin_required: false,
        },
      },
      credentials: ['dbc2023'],
    }).times(1).reply(200, {
      uri: 'openid-credential-offer://?credential_offer=%7B%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%221234%22%2C%22user_pin_required%22%3Afalse%7D%7D%2C%22credentials%22%3A%5B%22dbc2023%22%5D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fmy-vci-endpoint%2Fissuer%2Fdbc2023%22%7D',
    })
    await expect(
      agent.vciClientCreateOfferUri({
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': '1234',
            user_pin_required: false,
          },
        },
        credentials: ['dbc2023'],
      })
    ).resolves.toBeDefined()
  })
})
