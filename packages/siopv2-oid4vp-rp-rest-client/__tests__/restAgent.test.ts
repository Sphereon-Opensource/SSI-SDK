import {createAgent, IResolver} from '@veramo/core';
import {SiopV2OID4VpRpRestClient} from "../src";


const definitionId = "9449e2db-791f-407c-b086-c21cc677d2e0"
const baseUrl = 'https://ssi-backend.sphereon.com'

const agent = createAgent<IResolver>({
  plugins: [
    new SiopV2OID4VpRpRestClient(
        baseUrl,
        definitionId
    )
  ],
})

describe('@sphereon/siopv2-oid4vp-rp-rest-client', () => {
  it('should call the endpoint for deleteDefinitionCorrelation', async () => {
    const authRequest = await agent.generateAuthRequest({})
    await expect(agent.deleteDefinitionCorrelation({
      correlationId: authRequest.correlationId
    })).toBeDefined()
  }, 20000)

  it('should call the endpoint for generateAuthRequest', async () => {
    const result = await agent.generateAuthRequest({})
    expect(result.definitionId).toEqual(definitionId)
  }, 20000)

  it('should call the endpoint for getAuthStatus', async () => {
    const authRequest = await agent.generateAuthRequest({})
    await expect(agent.getAuthStatus({
      correlationId: authRequest.correlationId
    })).toBeDefined()
  }, 20000)
})
