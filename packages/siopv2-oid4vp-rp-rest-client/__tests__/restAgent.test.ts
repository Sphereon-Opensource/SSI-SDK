import { createAgent, IResolver } from '@veramo/core'
import { SiopV2OID4VpRpRestClient } from '../src'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver>({
  plugins: [new SiopV2OID4VpRpRestClient(baseUrl, definitionId)],
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the endpoint for deleteDefinitionCorrelation', async () => {
    const authRequest = await agent.generateAuthRequest({})
    agent.removeAuthRequestSession({
      correlationId: authRequest.correlationId,
    })
    await new Promise((f) => setTimeout(f, 5000))
    await expect(
      agent.getAuthStatus({
        correlationId: authRequest.correlationId,
      })
    ).rejects.toThrow('Statue has returned 404')
  }, 10000)

  it('should call the endpoint for generateAuthRequest', async () => {
    const result = await agent.generateAuthRequest({})
    expect(result.definitionId).toEqual(definitionId)
  }, 5000)

  it('should call the endpoint for getAuthStatus', async () => {
    const authRequest = await agent.generateAuthRequest({})
    const result = await agent.getAuthStatus({
      correlationId: authRequest.correlationId,
    })
    expect(result.status).toBe('created')
  }, 5000)
})
