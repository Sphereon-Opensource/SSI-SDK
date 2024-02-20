import { createAgent, IResolver } from '@veramo/core'
import { ISIOPv2OID4VPRPRestClient, SIOPv2OID4VPRPRestClient } from '../src'
import { AuthStatusResponse, GenerateAuthRequestURIResponse } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'

const definitionId = '9449e2db-791f-407c-b086-c21cc677d2e0'
const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver & ISIOPv2OID4VPRPRestClient>({
  plugins: [new SIOPv2OID4VPRPRestClient({ baseUrl, definitionId })],
})

xdescribe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  // disabled because the delete call hangs. Since endpoints will be updated anyway, skiping this for now
  xit('should call the endpoint for siopClientRemoveAuthRequestSession', async () => {
    const authRequest: GenerateAuthRequestURIResponse = await agent.siopClientCreateAuthRequest({})
    await agent.siopClientRemoveAuthRequestState({
      correlationId: authRequest.correlationId,
    })

    const result: AuthStatusResponse = await agent.siopClientGetAuthStatus({
      correlationId: authRequest.correlationId,
    })
    expect(result.status).toBe('error')
    expect(result.error).toBe('No authentication request mapping could be found for the given URL.')
  })

  it('should call the endpoint for siopClientGenerateAuthRequest', async () => {
    const result = await agent.siopClientCreateAuthRequest({})
    expect(result.definitionId).toEqual(definitionId)
  })

  it('should call the endpoint for siopClientGetAuthStatus', async () => {
    const authRequest = await agent.siopClientCreateAuthRequest({})
    const result = await agent.siopClientGetAuthStatus({
      correlationId: authRequest.correlationId,
    })
    expect(result.status).toBe('created')
  })
})
