import { TAgent } from '@veramo/core'
import fetch, { Request, Response } from 'cross-fetch'
// @ts-ignore
import nock from 'nock'
import { IResourceResolver } from '../../src'
import * as path from 'path'
import * as fs from 'fs'

type ConfiguredAgent = TAgent<IResourceResolver>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Resource Resolver Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should get resource by input as string', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
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
      const responseData = await (<Response>response).json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as URL', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
      const url = new URL('https://example.com/1') // TODO /1
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname)
        .reply(200, responseBody)

      const response = await agent.resourceResolve({
        input: url,
        resourceType: 'test_type'
      })
      const responseData = await (<Response>response).json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    it('should get resource by input as RequestInfo', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
      const url = new URL('https://example.com/1') // TODO /1
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
      const responseData = await (<Response>response).json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
    })

    // TODO test POST

    it('should fetch resource when resource insertion exceeds max age option', async (): Promise<void> => {
      const url = new URL('https://example.com/4') // TODO /4
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

      await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type'
      })

      const response = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 1
        }
      })
      const responseData = await (<Response>response).json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(2)
      // TODO check new insertion timestamp
    })

    it('should get resource from cache when max age option exceeds resource insertion', async (): Promise<void> => {
      const url = new URL('https://example.com/5') // TODO /5
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

      await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type'
      })

      const response = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          maxAgeMs: 10000
        }
      })
      const responseData = await (<Response>response).json()

      expect(responseData).toBeDefined()
      expect(responseData.resource).toEqual(responseBody.resource)
      expect(called).toEqual(1)
    })

    it('should get resource from cache with cache only option', async (): Promise<void> => {
      const url = new URL('https://example.com/2') // TODO /5
      const responseBody = {
        resource: 'test_value',
      }

      nock(url.origin).get(url.pathname)
        .times(1)
        .reply(200, responseBody)

      await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
      })

      const response = await agent.resourceResolve({
        input: url.toString(),
        resourceType: 'test_type',
        resolveOpts: {
          onlyCache: true
        }
      })

      const responseData = await (<Response>response).json()
      expect(responseData.resource).toEqual('test_value')
    })

    it('should return error response when no resource found with cache only option ', async (): Promise<void> => { // TODO proper urls in test
      const response = await agent.resourceResolve({
        input: 'https://example.com/3',
        resourceType: 'test',
        resolveOpts: {
          onlyCache: true
          //mode: 'cache_only'
        }
      })

      const responseData = await (<Response>response).json()
      expect((<Response>response).status).toEqual(404)
      expect((<Response>response).statusText).toEqual('Not Found')
      expect(responseData.error).toEqual('Resource not found')
    })

    it('should get resource as blob', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
      const url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc9APxkj0xClmrU3PpMZglHQkx446nQPG6lA&s'

      const response = await fetch(url)
      //const buffer = Buffer.from(JSON.stringify(response))
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`BUFFER: ${JSON.stringify(arrayBuffer)}`)
      const restoredBody = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const restoredResponse = new Response(restoredBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      const image = await restoredResponse.arrayBuffer()
      const imageBuffer = Buffer.from(image);

      const destPath = path.join('C:/temp', 'downloaded-image.jpg');
      fs.writeFile(destPath, imageBuffer, (err) => {
        if (err) {
          throw err;
        }
      });

    })


    // it('should get resource by namespace', async (): Promise<void> => { // TODO create a persists test // fix values // cleanup
    //   const namespace = 'testNamespace'
    //
    //   const result1 = await agent.rrPersistResource({
    //     resource: 'abc_test',
    //     resourceIdentifier: 'id1',
    //     namespace
    //   })
    //
    //   console.log(`result1: ${JSON.stringify(result1)}`)
    //
    //   const result2 = await agent.rrGetResource({ resourceIdentifier: 'id1', namespace })
    //
    //   console.log(`result2: ${JSON.stringify(result2)}`)
    //
    //   expect(result2.value).toEqual('abc_test')
    // })

    // TODO test if error reponses do not get persisted

  })
}
