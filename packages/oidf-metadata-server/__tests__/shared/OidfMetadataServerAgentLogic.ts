import { TAgent } from '@veramo/core'
import {
  FederationMetadataImportArgs,
  IFederationMetadataPersistArgs,
  IOIDFMetadataStore,
  OIDFMetadataServer,
  OpenidFederationMetadata,
  OpenidFederationValueData,
} from '../../src'
import 'cross-fetch/polyfill'
import { ExpressSupport } from '@sphereon/ssi-express-support'
import { HttpTerminator } from 'http-terminator'
import { IRequiredContext } from '../../src/types/metadata-server'
import { IMetadataImportArgs } from '@sphereon/ssi-types'

type ConfiguredAgent = TAgent<IOIDFMetadataStore>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<ExpressSupport>; tearDown: () => Promise<boolean> }): void => {
  describe('OIDF Metadata Server', (): void => {
    let agent: ConfiguredAgent
    let expressSupport: ExpressSupport
    let terminator: HttpTerminator

    const mockMetadata: OpenidFederationMetadata = {
      baseUrl: `http://localhost:3333/test-entity`,
      jwt: 'eyJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwidHlwIjoiZW50aXR5LXN0YXRlbWVudCtqd3QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJtZXRhZGF0YSI6e30sImp3a3MiOnsia2V5cyI6W3sia3R5IjoiRUMiLCJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwiY3J2IjoiUC0yNTYiLCJ4IjoiS1JNMXI5S3d0cXRzWVdiTGJPdmIzQ1ZxWF9iTm9vTlJORkRrRTQzSlpZQSIsInkiOiJZbUVYNWY4VndFOS1KYms3aHhwdnMzdlhUc3hOUVhHR2pZRE11SjhUYmlzIiwiYWxnIjoiRVMyNTYiLCJ1c2UiOiJzaWcifV19LCJpc3MiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJhdXRob3JpdHlfaGludHMiOlsiaHR0cHM6Ly9mZWRlcmF0aW9uLmRlbW8uc3BoZXJlb24uY29tIl0sImV4cCI6MTc2MjI3MjY1MywiaWF0IjoxNzMwNzM2NjUzfQ.Vet8M8FZe3VSn8AsqeJyMvGP_6gC9DAOSHVxqzOYytzfCQrF2TmSjRb8ICRzFiP3Vt53S-KScJUr65F-eDiyDw',
      enabled: true,
    }

    beforeAll(async (): Promise<void> => {
      expressSupport = await testContext.setup()
      agent = testContext.getAgent()
    })

    beforeEach(async () => {
      await agent.oidfStoreClearAllMetadata()
    })

    afterAll(async () => {
      await terminator.terminate()
      void testContext.tearDown()
    })

    describe('Metadata Store Operations', () => {
      it('should persist and retrieve metadata', async () => {
        const persistArgs: IFederationMetadataPersistArgs = {
          metadataType: 'openidFederation',
          correlationId: 'test-correlation-id',
          metadata: mockMetadata,
          overwriteExisting: true,
        }

        const persistedData = (await agent.oidfStorePersistMetadata(persistArgs)) as OpenidFederationValueData
        expect(persistedData?.value).toBeDefined()
        expect(persistedData?.value?.jwt).toBe(mockMetadata.jwt)

        const retrievedMetadata = await agent.oidfStoreGetMetadata({
          correlationId: 'test-correlation-id',
        })

        expect(retrievedMetadata).toBeDefined()
        expect(retrievedMetadata?.jwt).toBe(mockMetadata.jwt)
      })

      it('should list all metadata', async () => {
        const metadata1 = { ...mockMetadata, baseUrl: 'http://127.0.0.1:3333/entity1' } satisfies OpenidFederationMetadata
        const metadata2 = { ...mockMetadata, baseUrl: 'http://127.0.0.1:3333/entity2' } satisfies OpenidFederationMetadata

        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-id-1',
          metadata: metadata1,
        } satisfies IFederationMetadataPersistArgs)
        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-id-2',
          metadata: metadata2,
        } satisfies IFederationMetadataPersistArgs)

        const retrievedMetadata1 = await agent.oidfStoreGetMetadata({
          correlationId: 'test-id-1',
        })
        expect(retrievedMetadata1).toBeDefined()

        const retrievedMetadata2 = await agent.oidfStoreGetMetadata({
          correlationId: 'test-id-2',
        })
        expect(retrievedMetadata2).toBeDefined()

        const metadataList = await agent.oidfStoreListMetadata({})

        expect(metadataList).toHaveLength(2)
        expect(metadataList.map((m) => m?.baseUrl)).toContain(metadata1.baseUrl)
        expect(metadataList.map((m) => m?.baseUrl)).toContain(metadata2.baseUrl)
      })

      it('should check if metadata exists', async () => {
        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-exists-id',
          metadata: mockMetadata,
        })

        const exists = await agent.oidfStoreHasMetadata({
          correlationId: 'test-exists-id',
        })
        const notExists = await agent.oidfStoreHasMetadata({
          correlationId: 'non-existent-id',
        })

        expect(exists).toBe(true)
        expect(notExists).toBe(false)
      })

      it('should remove metadata', async () => {
        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-remove-id',
          metadata: mockMetadata,
        })

        const removed = await agent.oidfStoreRemoveMetadata({
          correlationId: 'test-remove-id',
        })

        expect(removed).toBe(true)

        const exists = await agent.oidfStoreHasMetadata({
          correlationId: 'test-remove-id',
        })
        expect(exists).toBe(false)
      })

      it('should clear all metadata', async () => {
        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-id-1',
          metadata: mockMetadata,
        })
        await agent.oidfStorePersistMetadata({
          metadataType: 'openidFederation',
          correlationId: 'test-id-2',
          metadata: mockMetadata,
        })

        const cleared = await agent.oidfStoreClearAllMetadata({})
        expect(cleared).toBe(true)

        const metadataList = await agent.oidfStoreListMetadata({})
        expect(metadataList).toHaveLength(0)
      })
    })

    describe('Federation Endpoints', () => {
      let server: OIDFMetadataServer

      const mockMetadatas: Array<OpenidFederationMetadata> = [
        {
          baseUrl: `http://127.0.0.1:3333/oid4vci`,
          jwt: 'eyJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwidHlwIjoiZW50aXR5LXN0YXRlbWVudCtqd3QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJtZXRhZGF0YSI6e30sImp3a3MiOnsia2V5cyI6W3sia3R5IjoiRUMiLCJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwiY3J2IjoiUC0yNTYiLCJ4IjoiS1JNMXI5S3d0cXRzWVdiTGJPdmIzQ1ZxWF9iTm9vTlJORkRrRTQzSlpZQSIsInkiOiJZbUVYNWY4VndFOS1KYms3aHhwdnMzdlhUc3hOUVhHR2pZRE11SjhUYmlzIiwiYWxnIjoiRVMyNTYiLCJ1c2UiOiJzaWcifV19LCJpc3MiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJhdXRob3JpdHlfaGludHMiOlsiaHR0cHM6Ly9mZWRlcmF0aW9uLmRlbW8uc3BoZXJlb24uY29tIl0sImV4cCI6MTc2MjI3MjY1MywiaWF0IjoxNzMwNzM2NjUzfQ.Vet8M8FZe3VSn8AsqeJyMvGP_6gC9DAOSHVxqzOYytzfCQrF2TmSjRb8ICRzFiP3Vt53S-KScJUr65F-eDiyDw',
          enabled: true,
        },
        {
          baseUrl: `http://localhost:3333/siop`,
          jwt: 'eyJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwidHlwIjoiZW50aXR5LXN0YXRlbWVudCtqd3QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJtZXRhZGF0YSI6e30sImp3a3MiOnsia2V5cyI6W3sia3R5IjoiRUMiLCJraWQiOiIwY0tSTlpnV0FqWjVBcTcyYnpSVFhDOHBCbU1DRG0tNlA0NWFHbURveVU0IiwiY3J2IjoiUC0yNTYiLCJ4IjoiS1JNMXI5S3d0cXRzWVdiTGJPdmIzQ1ZxWF9iTm9vTlJORkRrRTQzSlpZQSIsInkiOiJZbUVYNWY4VndFOS1KYms3aHhwdnMzdlhUc3hOUVhHR2pZRE11SjhUYmlzIiwiYWxnIjoiRVMyNTYiLCJ1c2UiOiJzaWcifV19LCJpc3MiOiJodHRwczovL2FnZW50LmZpbmR5bmV0LmRlbW8uc3BoZXJlb24uY29tL29pZDR2Y2kiLCJhdXRob3JpdHlfaGludHMiOlsiaHR0cHM6Ly9mZWRlcmF0aW9uLmRlbW8uc3BoZXJlb24uY29tIl0sImV4cCI6MTc2MjI3MjY1MywiaWF0IjoxNzMwNzM2NjUzfQ.Vet8M8FZe3VSn8AsqeJyMvGP_6gC9DAOSHVxqzOYytzfCQrF2TmSjRb8ICRzFiP3Vt53S-KScJUr65F-eDiyDwsiop',
          enabled: true,
        },
      ]

      beforeAll(async (): Promise<void> => {
        terminator = expressSupport.start({ doNotStartListening: false }).terminator
        const context: IRequiredContext = { agent: testContext.getAgent() }
        server = await OIDFMetadataServer.init({ context, expressSupport })
      })

      it('should serve federation metadata over HTTP', async () => {
        const importArgList: Array<FederationMetadataImportArgs> = mockMetadatas.map((mockMetadata: OpenidFederationMetadata, index: number) => ({
          metadataType: 'openidFederation',
          correlationId: `test-endpoint-${index}`,
          metadata: mockMetadata,
        }))
        await agent.oidfStoreImportMetadatas(importArgList as Array<IMetadataImportArgs>)

        // reload updated config
        await server.up()

        const response = await fetch('http://127.0.0.1:3333/oid4vci/.well-known/openid-federation')

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toBe('application/entity-statement+jwt')
        expect(await response.text()).toBe(mockMetadatas[0].jwt)

        const response2 = await fetch('http://localhost:3333/siop/.well-known/openid-federation')
        expect(await response2.text()).toBe(mockMetadatas[1].jwt)
        expect(response2.status).toBe(200)

        const response3 = await fetch('http://localhost:3333/oid4vci/.well-known/openid-federation')
        expect(response3.status).toBe(404)
      })
    })
  })
}
