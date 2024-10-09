import { TAgent } from '@veramo/core'
import { Request } from 'cross-fetch'
// @ts-ignore
import nock from 'nock'
import { IResourceResolver } from '../../src'

type ConfiguredAgent = TAgent<IResourceResolver>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Resource Resolver Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should get resource by input as string', async (): Promise<void> => {
      const url = new URL('https://example.com/1') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type'
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as URL', async (): Promise<void> => {
      const url = new URL('https://example.com/2') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: url,
        resourceType: 'test_type'
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as RequestInfo', async (): Promise<void> => {
      const url = new URL('https://example.com/3') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'GET'
      })

      nock(url.origin).get(url.pathname)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type'
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource with POST request', async (): Promise<void> => {
      const url = new URL('https://example.com/4') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ test_field: 'test_value' })
      })

      nock(url.origin).post(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type'
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should fetch resource with POST request with different body', async (): Promise<void> => { // TODO finish test
      const url = new URL('https://example.com/5') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ test_field: 'test_value' })
      })

      nock(url.origin).post(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type'
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should fetch resource when resource insertion exceeds max age option', async (): Promise<void> => {
      const url = new URL('https://example.com/6') // TODO /4
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin).get(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type'
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 1
        }
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(2)
      // TODO check new insertion timestamp
    })

    it('should get resource from cache when max age option exceeds resource insertion', async (): Promise<void> => {
      const url = new URL('https://example.com/7') // TODO /5
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin).get(url.pathname)
        .times(1)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type'
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 10000
        }
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource from cache with cache only option', async (): Promise<void> => {
      const url = new URL('https://example.com/8') // TODO /5
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname)
        .times(1)
        .reply(200, responseBody)

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          onlyCache: true
        }
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual('test_value')
    })

    it('should return error response when no resource found with cache only option ', async (): Promise<void> => {
      const response = await agent.resourceResolve({
        input: 'https://example.com/9',
        resourceType: 'test_type',
        resolveOpts: {
          onlyCache: true
        }
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(response.status).toEqual(404)
      expect(response.statusText).toEqual('Not Found')
      expect(responseData.error).toEqual('Resource not found')
    })

    it('should get resource from cache by namespace', async (): Promise<void> => {
      const namespace = 'test_namespace'
      const url = new URL('https://example.com/10') // TODO /5
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin).get(url.pathname)
        .times(1)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should fetch resource by different namespaces', async (): Promise<void> => {
      const url = new URL('https://example.com/11') // TODO /5
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin).get(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace: 'test_namespace1'
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace: 'test_namespace2'
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(2)
    })

    // TODO test if error responses do not get persisted

  })
}
