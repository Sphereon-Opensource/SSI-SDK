import { createAgent, IResolver } from '@veramo/core'
// @ts-ignore
import nock from 'nock'
import { ISIOPv2OID4VPRPRestClient, SIOPv2OID4VPRPRestClient } from '../src'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://my-siop-endpoint'

const agent = createAgent<IResolver & ISIOPv2OID4VPRPRestClient>({
  plugins: [new SIOPv2OID4VPRPRestClient({ baseUrl, definitionId })],
})
afterAll(() => {
  nock.cleanAll()
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the mock endpoint for siopClientRemoveAuthRequestSession', async () => {
    const correlationId = 'test-correlation-id'
    nock(`${baseUrl}/webapp/definitions/${definitionId}/auth-requests`).delete(`/${correlationId}`).times(1).reply(200, {})
    await expect(
      agent.siopClientRemoveAuthRequestState({
        correlationId: 'test-correlation-id',
      }),
    ).resolves.toEqual(true)
  })

  it('should call the mock endpoint for siopClientCreateAuthRequest', async () => {
    nock(`${baseUrl}/webapp/definitions/${definitionId}`).post(`/auth-requests`).times(1).reply(200, {})
    await expect(agent.siopClientCreateAuthRequest({})).resolves.toBeDefined()
  })

  it('should call the mock endpoint for siopClientGetAuthStatus', async () => {
    nock(`${baseUrl}/webapp`)
      .post(`/auth-status`, {
        correlationId: 'my-correlation-id',
        definitionId,
      })
      .times(1)
      .reply(200, {})
    await expect(
      agent.siopClientGetAuthStatus({
        correlationId: 'my-correlation-id',
      }),
    ).resolves.toBeDefined()
  })
})
