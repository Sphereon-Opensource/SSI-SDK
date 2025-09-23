import { createAgent, IResolver } from '@veramo/core'
// @ts-ignore
import nock from 'nock'
import { ISIOPv2OID4VPRPRestClient, SIOPv2OID4VPRPRestClient } from '../src'
import { afterAll, describe, expect, it } from 'vitest'

const queryId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://my-siop-endpoint'

const agent = createAgent<IResolver & ISIOPv2OID4VPRPRestClient>({
  plugins: [new SIOPv2OID4VPRPRestClient({ baseUrl })],
})
afterAll(() => {
  nock.cleanAll()
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the mock endpoint for siopClientRemoveAuthRequestSession', async () => {
    const correlationId = 'test-correlation-id'
    // Fix the URL pattern to match actual implementation
    nock(baseUrl).delete(`/backend/auth/requests/${correlationId}`).times(1).reply(200, {})

    await expect(
      agent.siopClientRemoveAuthRequestState({
        correlationId: 'test-correlation-id',
      }),
    ).resolves.toEqual(true)
  })

  it('should call the mock endpoint for siopClientCreateAuthRequest', async () => {
    const mockResponse = {
      correlation_id: 'test-correlation-id', // snake_case
      query_id: queryId, // snake_case
      request_uri: 'https://example.com/request-uri', // snake_case
      status_uri: 'https://example.com/status-uri', // snake_case
      qr_uri: 'https://example.com/qr-uri', // snake_case (optional)
    }

    nock(baseUrl).post('/backend/auth/requests').times(1).reply(200, mockResponse)

    await expect(agent.siopClientCreateAuthRequest({ queryId })).resolves.toBeDefined()
  })

  it('should call the mock endpoint for siopClientGetAuthStatus', async () => {
    // Fix: Use GET method and correct URL pattern
    nock(baseUrl).get('/backend/auth/status/my-correlation-id').times(1).reply(200, { status: 'created' })

    const status = await agent.siopClientGetAuthStatus({
      correlationId: 'my-correlation-id',
    })
    expect(status).toBeDefined()
  })
})
