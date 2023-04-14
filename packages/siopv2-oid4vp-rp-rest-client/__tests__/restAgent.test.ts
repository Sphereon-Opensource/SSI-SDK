import { createAgent, IResolver } from '@veramo/core'
import { SiopV2OID4VpRpRestClient } from '../src'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver>({
  plugins: [new SiopV2OID4VpRpRestClient(baseUrl, definitionId)],
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the endpoint for siopClientRemoveAuthRequestSession', async () => {
    const authRequest = await agent.siopClientGenerateAuthRequest({})
    agent.siopClientRemoveAuthRequestSession({
      correlationId: authRequest.correlationId,
    })
    await new Promise((f) => setTimeout(f, 5000))
    await expect(
      agent.siopClientGetAuthStatus({
        correlationId: authRequest.correlationId,
      })
    ).rejects.toThrow('Statue has returned 404')
  }, 7000)

  it('should call the endpoint for siopClientGenerateAuthRequest', async () => {
    const result = await agent.siopClientGenerateAuthRequest({})
    expect(result.definitionId).toEqual(definitionId)
  })

  it('should call the endpoint for siopClientGetAuthStatus', async () => {
    const authRequest = await agent.siopClientGenerateAuthRequest({})
    const result = await agent.siopClientGetAuthStatus({
      correlationId: authRequest.correlationId,
    })
    expect(result.status).toBe('created')
  })
})
