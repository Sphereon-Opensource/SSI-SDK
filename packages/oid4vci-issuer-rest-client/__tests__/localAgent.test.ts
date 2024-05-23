import { createObjects, getConfig } from '../../agent-config/dist'

jest.setTimeout(60000)

import issuanceRestClientAgentLogic from './shared/issuanceRestClientAgentLogic'
import nock from 'nock'

let agent: any

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/oid4vci-issuer-rest-client/agent.yml')
  const { localAgent } = await createObjects(config, { localAgent: '/agent' })
  agent = localAgent
  nock('https://ssi-backend.sphereon.com/webapp/')
    .post(`/credential-offers`, {
      credential_configuration_ids: ['dbc2023'],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': '1234',
        },
      },
    })
    .times(4)
    .reply(200, {
      uri: 'openid-credential-offer://?credential_offer=%7B%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%221234%22%2C%22%7D%2C%22credential_configuration_ids%22%3A%5B%22dbc2023%22%5D%2C%22credential_issuer%22%3A%22https%3A%2F%2Fdbc2023.test.sphereon.com%2Fissuer%2Fdbc2023%22%7D',
    })
  return true
}

const tearDown = async (): Promise<boolean> => {
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', () => {
  issuanceRestClientAgentLogic(testContext)
})
