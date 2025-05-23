import { TAgent } from '@veramo/core'
import { Request } from 'cross-fetch'
// @ts-ignore
import nock from 'nock'
import { IResourceResolver } from '../../src'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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
      const url = new URL('https://example.com/string_input')
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname).reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as URL', async (): Promise<void> => {
      const url = new URL('https://example.com/url_input')
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname).reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: url,
        resourceType: 'test_type',
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as RequestInfo', async (): Promise<void> => {
      const url = new URL('https://example.com/request_info_input')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'GET',
      })

      nock(url.origin).get(url.pathname).reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource with POST request', async (): Promise<void> => {
      const url = new URL('https://example.com/post')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ test_field: 'test_value' }),
      })

      let called = 0
      nock(url.origin)
        .post(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource with PUT request', async (): Promise<void> => {
      const url = new URL('https://example.com/put')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'PUT',
        body: JSON.stringify({ test_field: 'test_value' }),
      })

      let called = 0
      nock(url.origin)
        .put(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource with DELETE request', async (): Promise<void> => {
      const url = new URL('https://example.com/delete')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'DELETE',
        body: JSON.stringify({ test_field: 'test_value' }),
      })

      let called = 0
      nock(url.origin)
        .delete(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource with HEAD request', async (): Promise<void> => {
      const url = new URL('https://example.com/head')
      const requestInfo = new Request(url.toString(), {
        method: 'HEAD',
      })

      let called = 0
      nock(url.origin)
        .head(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()

      expect(response2.status).toEqual(200)
      expect(called).toEqual(1)
    })

    it('should get resource with OPTIONS request', async (): Promise<void> => {
      const url = new URL('https://example.com/options')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'OPTIONS',
        body: JSON.stringify({ test_field: 'test_value' }),
      })

      let called = 0
      nock(url.origin)
        .options(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource with CONNECT request', async (): Promise<void> => {
      const url = new URL('https://example.com/connect')
      const requestInfo = new Request(url.toString(), {
        method: 'CONNECT',
      })

      let called = 0
      nock(url.origin)
        .intercept(url.pathname, 'CONNECT')
        .times(2)
        .reply(200, () => {
          called++
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()

      expect(response2.status).toEqual(200)
      expect(called).toEqual(1)
    })

    it('should get resource with TRACE request', async (): Promise<void> => {
      const url = new URL('https://example.com/trace')
      const requestInfo = new Request(url.toString(), {
        method: 'TRACE',
      })

      let called = 0
      nock(url.origin)
        .intercept(url.pathname, 'TRACE')
        .times(2)
        .reply(200, () => {
          called++
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()

      expect(response2.status).toEqual(200)
      expect(called).toEqual(1)
    })

    it('should get resource with PATCH request', async (): Promise<void> => {
      const url = new URL('https://example.com/patch')
      const responseBody = {
        resource: 'test_value',
      }
      const requestInfo = new Request(url.toString(), {
        method: 'PATCH',
        body: JSON.stringify({ test_field: 'test_value' }),
      })

      let called = 0
      nock(url.origin)
        .patch(url.pathname, { test_field: 'test_value' })
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: requestInfo,
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should fetch resource when resource insertion exceeds max age option', async (): Promise<void> => {
      const url = new URL('https://example.com/fetch_max_age')
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 1,
        },
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(2)
    })

    it('should get resource from cache when max age option exceeds resource insertion', async (): Promise<void> => {
      const url = new URL('https://example.com/cache_max_age')
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(1)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 10000,
        },
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource from cache with cache only option', async (): Promise<void> => {
      const url = new URL('https://example.com/cache_only')
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname).times(1).reply(200, responseBody)

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          onlyCache: true,
        },
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual('test_value')
    })

    it('should return error response when no resource found with cache only option ', async (): Promise<void> => {
      const response = await agent.resourceResolve({
        input: 'https://example.com/cache_only_error',
        resourceType: 'test_type',
        resolveOpts: {
          onlyCache: true,
        },
      })
      expect(response).toBeDefined()
      const responseData = await response.json()

      expect(response.status).toEqual(404)
      expect(response.statusText).toEqual('Not Found')
      expect(responseData.error).toEqual('Resource not found')
    })

    it('should get resource from cache by namespace', async (): Promise<void> => {
      const namespace = 'test_namespace'
      const url = new URL('https://example.com/namespace')
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(1)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace,
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace,
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should fetch resource by different namespaces', async (): Promise<void> => {
      const url = new URL('https://example.com/namespaces')
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace: 'test_namespace1',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        namespace: 'test_namespace2',
      })
      expect(response2).toBeDefined()
      const responseData = await response2.json()

      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(2)
    })

    it('should not persist resource when status code is not in 200', async (): Promise<void> => {
      const url = new URL('https://example.com/error_status_code')
      const responseBody = {
        error: 'error',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(2)
        .reply(500, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })
      expect(response2).toBeDefined()

      expect(called).toEqual(2)
    })

    it('should not persist resource with skip persistence option', async (): Promise<void> => {
      const url = new URL('https://example.com/skip_persistence')
      const responseBody = {
        resource: 'test_value',
      }

      let called = 0
      nock(url.origin)
        .get(url.pathname)
        .times(2)
        .reply(200, () => {
          called++
          return responseBody
        })

      const response1 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          skipPersistence: true,
        },
      })
      expect(response1).toBeDefined()

      const response2 = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          skipPersistence: true,
        },
      })
      expect(response2).toBeDefined()

      expect(called).toEqual(2)
    })

    it('should clear all resources', async (): Promise<void> => {
      const result = await agent.resourceClearAllResources()
      expect(result).toEqual(true)
    })

    it('should throw error when clearing resources with unknown store id', async (): Promise<void> => {
      const storeId = 'unknown'
      await expect(agent.resourceClearAllResources({ storeId })).rejects.toThrow(`Could not get resource store: ${storeId}`)
    })

    it('should get default store id', async (): Promise<void> => {
      const result = await agent.resourceDefaultStoreId()
      expect(result).toEqual('_default')
    })

    it('should get default namespace', async (): Promise<void> => {
      const result = await agent.resourceDefaultNamespace()
      expect(result).toEqual('resources')
    })

    it('should get default ttl', async (): Promise<void> => {
      const result = await agent.resourceDefaultTtl()
      expect(result).toEqual(3600)
    })
  })
}
