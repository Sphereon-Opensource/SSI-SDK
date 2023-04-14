import { createAgent, IResolver } from '@veramo/core'
// @ts-ignore
import nock from 'nock'
import { SiopV2OID4VpRpRestClient } from '../src'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://my-siop-endpoint'

const agent = createAgent<IResolver>({
  plugins: [new SiopV2OID4VpRpRestClient(baseUrl, definitionId)],
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the mock endpoint for siopClientRemoveAuthRequestSession', async () => {
    const correlationId = 'test-correlation-id'
    nock(`${baseUrl}/webapp/definitions/${definitionId}/auth-requests`).delete(`/${correlationId}`).times(5).reply(200, {})
    await expect(
      agent.siopClientRemoveAuthRequestSession({
        correlationId: 'test-correlation-id',
      })
    ).toBeDefined()
  })

  it('should call the mock endpoint for siopClientGenerateAuthRequest', async () => {
    nock(`${baseUrl}/webapp/definitions/${definitionId}`)
      .get(`/auth-request-uri`)
      .times(5)
      .reply(200, {
        correlationId: '60683696-02dd-4172-8bce-93b988bc55c3',
        definitionId: definitionId,
        authRequestURI: `openid-vc://?request_uri=https%3A%2F%2Fmy-siop-endpoint%2Fext%2Fdefinitions%${definitionId}%2Fauth-requests%2F60683696-02dd-4172-8bce-93b988bc55c3`,
        authStatusURI: `${baseUrl}/webapp/auth-status`,
      })
    await expect(agent.siopClientGenerateAuthRequest({})).toBeDefined()
  })

  it('should call the mock endpoint for siopClientGetAuthStatus', async () => {
    nock(`${baseUrl}/webapp`)
      .post(`/auth-status`, {
        correlationId: 'my-correlation-id',
        definitionId,
      })
      .times(5)
      .reply(200)
    await expect(
      agent.siopClientGetAuthStatus({
        correlationId: 'my-correlation-id',
      })
    ).toBeDefined()
  })
})
