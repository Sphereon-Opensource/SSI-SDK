import { createAgent, IResolver } from '@veramo/core'
// @ts-ignore
import nock from 'nock'
import { SiopV2OID4VpRpRestClient } from '../src'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver>({
  plugins: [new SiopV2OID4VpRpRestClient(baseUrl, definitionId)],
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the mock endpoint for deleteDefinitionCorrelation', async () => {
    const correlationId = 'test-correlation-id'
    nock(`${baseUrl}/webapp/definitions/${definitionId}/auth-requests`).delete(`/${correlationId}`).times(5).reply(200, {})
    agent.removeAuthRequestSession({
      correlationId: 'test-correlation-id',
    })
  })

  it('should call the mock endpoint for generateAuthRequest', async () => {
    nock(`${baseUrl}/webapp/definitions/${definitionId}`).get(`/auth-request-uri`).times(5).reply(200)
    await expect(agent.generateAuthRequest({})).toBeDefined()
  })

  it('should call the mock endpoint for getAuthStatus', async () => {
    nock(`${baseUrl}/webapp`)
      .post(`/auth-status`, {
        correlationId: 'my-correlation-id',
        definitionId,
      })
      .times(5)
      .reply(200)
    await expect(
      agent.getAuthStatus({
        correlationId: 'my-correlation-id',
      })
    ).toBeDefined()
  })
})
