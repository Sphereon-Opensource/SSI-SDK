import { createAgent, IResolver } from '@veramo/core'
import { SiopV2OID4VpRpRestClient } from '../src'
import { AuthorizationRequestStateStatus } from '@sphereon/ssi-sdk-siopv2-oid4vp-common'

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
    const result = await agent.siopClientGetAuthStatus({
      correlationId: authRequest.correlationId,
    })
    expect(result.status).toBe(AuthorizationRequestStateStatus.ERROR)
    expect(result.error).toBe('No authentication request mapping could be found for the given URL.')
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
