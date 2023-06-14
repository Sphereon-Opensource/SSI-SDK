import { createAgent, IResolver } from '@veramo/core'
import { IOID4VCIRestClient, OID4VCIRestClient } from '../src'

const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver & IOID4VCIRestClient>({
  plugins: [new OID4VCIRestClient({ baseUrl })],
})

describe('@sphereon/ssi-sdk.oid4vci-rest-client', () => {
  xit('should mock the call endpoint vciClientCreateOfferUri', async () => {
    const result = await agent.vciClientCreateOfferUri({
      baseUri: 'https://dbc2023.test.sphereon.com/issuer/dbc2023',
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': '1234',
          user_pin_required: false,
        },
      },
      credentials: ['dbc2023'],
    })
    expect(result.uri).toEqual(
      'openid-credential-offer://?credential_offer=%7B%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%221234%22%2C%22user_pin_required%22%3Afalse%7D%7D%2C%22credentials%22%3A%5B%22dbc2023%22%5D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fdbc2023.test.sphereon.com%2Fissuer%2Fdbc2023%22%7D'
    )
  })
})
