import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DcqlQuery } from 'dcql'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DataStorePresentationDefinitionEntities,
  DataStorePresentationDefinitionMigrations,
  type DeleteDefinitionsArgs,
  ImportDcqlQueryItem,
  PDStore,
} from '../index'
import { DcqlQueryItem, GetDefinitionsArgs, NonPersistedDcqlQueryItem } from '../types'

export const SAMPLE_DCQL_QUERY_IMPORT: ImportDcqlQueryItem = {
  queryId: 'ajax-club',
  query: {
    credentials: [
      {
        id: 'clubcard-v1',
        format: 'dc+sd-jwt',
        require_cryptographic_holder_binding: true,
        multiple: false,
        meta: {
          vct_values: ['clubcard-v1'],
        },
        claims: [
          {
            path: ['personData', 'name'],
          },
          {
            path: ['personData', 'birthDate'],
          },
          {
            path: ['membershipData', 'membershipId'],
          },
          {
            path: ['membershipData', 'season'],
          },
        ],
      },
    ],
  },
}

describe('PDStore tests', (): void => {
  let dbConnection: DataSource
  let pdStore: PDStore

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      logging: ['info'],
      synchronize: false,
      migrationsRun: false,
      migrations: DataStorePresentationDefinitionMigrations,
      entities: DataStorePresentationDefinitionEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    pdStore = new PDStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await dbConnection.destroy()
  })

  it('should throw error when getting query with unknown id', async (): Promise<void> => {
    const itemId = 'unknownDefinitionId'

    await expect(pdStore.getDefinition({ itemId })).rejects.toThrow(`No presentation definition item found for id: ${itemId}`)
  })

  it('should get all queries', async (): Promise<void> => {
    const definition1: NonPersistedDcqlQueryItem = {
      queryId: 'definition1',
      version: '1.0',
      query: {
        credentials: [
          {
            id: 'id-card-v1',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['name'],
              },
            ],
          },
        ],
      },
    }
    const savedDefinition1: DcqlQueryItem = await pdStore.addDefinition(definition1)
    expect(savedDefinition1).toBeDefined()

    const definition2: NonPersistedDcqlQueryItem = {
      queryId: 'definition2',
      version: '1.0',
      query: {
        credentials: [
          {
            id: 'driver-license-v1',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['dateOfBirth'],
              },
            ],
          },
        ],
      },
    }
    const savedDefinition2: DcqlQueryItem = await pdStore.addDefinition(definition2)
    expect(savedDefinition2).toBeDefined()

    const result: Array<DcqlQueryItem> = await pdStore.getDefinitions({})

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should update dcql query', async (): Promise<void> => {
    const definition: NonPersistedDcqlQueryItem = {
      queryId: SAMPLE_DCQL_QUERY_IMPORT.queryId,
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }
    const savedDefinition: DcqlQueryItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const updatedDcqlQuery = DcqlQuery.parse({
      credentials: [
        {
          id: 'updated-clubcard',
          format: 'dc+sd-jwt',
          claims: [
            {
              path: ['name'],
            },
          ],
        },
      ],
    })

    const updatedDefinition: DcqlQueryItem = {
      ...savedDefinition,
      version: '1.1',
      query: updatedDcqlQuery,
    }

    await pdStore.updateDefinition(updatedDefinition)
    const result: DcqlQueryItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
    expect(result.version).toEqual('1.1')
    expect(result.query?.credentials[0].id).toEqual('updated-clubcard')
    expect(result.query?.credentials[0].format).toEqual('dc+sd-jwt')
  })

  it('should get dcql queries by id', async (): Promise<void> => {
    const definition: NonPersistedDcqlQueryItem = {
      queryId: SAMPLE_DCQL_QUERY_IMPORT.queryId,
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }

    const savedDefinition: DcqlQueryItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const result: DcqlQueryItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
    expect(result.query).toBeDefined()
    expect(result.query.credentials[0].format).toBe('dc+sd-jwt')
    if (result.query.credentials[0].format === 'dc+sd-jwt') {
      expect(result.query.credentials[0].meta?.vct_values).toContain('clubcard-v1')
    }
    expect(result.query.credentials[0].claims).toHaveLength(4)
  })

  it('should get dcql queries by filter', async (): Promise<void> => {
    const definition: NonPersistedDcqlQueryItem = {
      queryId: SAMPLE_DCQL_QUERY_IMPORT.queryId,
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }
    const savedDefinition: DcqlQueryItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const args: GetDefinitionsArgs = {
      filter: [{ queryId: 'ajax-club' }],
    }
    const result: Array<DcqlQueryItem> = await pdStore.getDefinitions(args)

    expect(result.length).toEqual(1)
    expect(result[0].query).toBeDefined()
    expect(result[0].query.credentials[0].id).toEqual('clubcard-v1')
  })

  it('should delete dcql query', async (): Promise<void> => {
    const definition: NonPersistedDcqlQueryItem = {
      queryId: 'definition1',
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }
    const savedDefinition: DcqlQueryItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    await pdStore.deleteDefinition({ itemId: savedDefinition.id })

    await expect(pdStore.getDefinition({ itemId: savedDefinition.id })).rejects.toThrow(
      `No presentation definition item found for id: ${savedDefinition.id}`,
    )
  })

  it('should delete dcql queries by filter', async (): Promise<void> => {
    const definition1: NonPersistedDcqlQueryItem = {
      queryId: 'definition1',
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }
    const savedDefinition1: DcqlQueryItem = await pdStore.addDefinition(definition1)
    expect(savedDefinition1).toBeDefined()

    const definition2: NonPersistedDcqlQueryItem = {
      queryId: 'definition2',
      version: '1.0',
      query: SAMPLE_DCQL_QUERY_IMPORT.query,
    }
    const savedDefinition2: DcqlQueryItem = await pdStore.addDefinition(definition2)
    expect(savedDefinition2).toBeDefined()

    const filter = { filter: [{ queryId: 'definition1' }] } satisfies DeleteDefinitionsArgs
    await pdStore.deleteDefinitions(filter)

    const remainingDefinitions: Array<DcqlQueryItem> = await pdStore.getDefinitions({})
    expect(remainingDefinitions.length).toEqual(1)
    expect(remainingDefinitions[0].queryId).toEqual('definition2')
  })
})
