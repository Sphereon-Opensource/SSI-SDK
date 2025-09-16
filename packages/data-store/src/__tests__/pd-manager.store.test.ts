import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { DcqlQueryPayload } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { DataStorePresentationDefinitionEntities, DataStorePresentationDefinitionMigrations, PDStore } from '../index'
import { GetDefinitionsArgs, NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '../types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

export const SAMPLE_DCQL_QUERY_PAYLOAD: DcqlQueryPayload = {
  queryId: 'ajax-club',
  dcqlQuery: {
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

  it('should check if definition exists', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const exists: boolean = await pdStore.hasDefinition({ itemId: savedDefinition.id })

    expect(exists).toBeTruthy()
  })

  it('should check if definitions exist by filter', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const exists: boolean = await pdStore.hasDefinitions({ filter: [{ definitionId: 'definition1' }] })

    expect(exists).toBeTruthy()
  })

  it('should get definition by id', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }

    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const result: PresentationDefinitionItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
  })

  it('should throw error when getting definition with unknown id', async (): Promise<void> => {
    const itemId = 'unknownDefinitionId'

    await expect(pdStore.getDefinition({ itemId })).rejects.toThrow(`No presentation definition item found for id: ${itemId}`)
  })

  it('should get all definitions', async (): Promise<void> => {
    const definition1: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition1: PresentationDefinitionItem = await pdStore.addDefinition(definition1)
    expect(savedDefinition1).toBeDefined()

    const definition2: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition2',
      version: '1.0',
      definitionPayload: { id: 'definition2', input_descriptors: [] },
    }
    const savedDefinition2: PresentationDefinitionItem = await pdStore.addDefinition(definition2)
    expect(savedDefinition2).toBeDefined()

    const result: Array<PresentationDefinitionItem> = await pdStore.getDefinitions({})

    expect(result).toBeDefined()
    expect(result.length).toEqual(2)
  })

  it('should get definitions by filter', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const args: GetDefinitionsArgs = {
      filter: [{ definitionId: 'definition1' }],
    }
    const result: Array<PresentationDefinitionItem> = await pdStore.getDefinitions(args)

    expect(result.length).toEqual(1)
  })

  it('should add definition', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }

    const result: PresentationDefinitionItem = await pdStore.addDefinition(definition)

    expect(result).toBeDefined()
    expect(result.definitionId).toEqual(definition.definitionId)
  })

  it('should add definition with dcqlPayload', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'ajax-club',
      version: '1.0',
      definitionPayload: { id: 'ajax-club', input_descriptors: [] },
      dcqlPayload: SAMPLE_DCQL_QUERY_PAYLOAD,
    }

    const result: PresentationDefinitionItem = await pdStore.addDefinition(definition)

    expect(result).toBeDefined()
    expect(result.definitionId).toEqual(definition.definitionId)
    expect(result.dcqlPayload).toBeDefined()
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].id).toEqual('clubcard-v1')
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].format).toEqual('dc+sd-jwt')
  })

  it('should update definition', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const updatedDefinition: PresentationDefinitionItem = {
      ...savedDefinition,
      version: '1.1',
    }

    await pdStore.updateDefinition(updatedDefinition)
    const result: PresentationDefinitionItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
    expect(result.version).toEqual('1.1')
  })

  it('should update definition with dcqlPayload', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'ajax-club',
      version: '1.0',
      definitionPayload: { id: 'ajax-club', input_descriptors: [] },
      dcqlPayload: SAMPLE_DCQL_QUERY_PAYLOAD,
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const updatedDcqlQueryPayload = {
      ...SAMPLE_DCQL_QUERY_PAYLOAD,
      dcqlQuery: {
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
      },
    } as unknown as DcqlQueryPayload // FIXME I do not have another solution for this atm, I can do Partial<DcqlQuery> but that does not work for its child entities

    const updatedDefinition: PresentationDefinitionItem = {
      ...savedDefinition,
      version: '1.1',
      dcqlPayload: updatedDcqlQueryPayload,
    }

    await pdStore.updateDefinition(updatedDefinition)
    const result: PresentationDefinitionItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
    expect(result.version).toEqual('1.1')
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].id).toEqual('updated-clubcard')
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].format).toEqual('dc+sd-jwt')
  })

  it('should get definition with dcqlPayload by id', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'ajax-club',
      version: '1.0',
      definitionPayload: { id: 'ajax-club', input_descriptors: [] },
      dcqlPayload: SAMPLE_DCQL_QUERY_PAYLOAD,
    }

    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const result: PresentationDefinitionItem = await pdStore.getDefinition({ itemId: savedDefinition.id })

    expect(result).toBeDefined()
    expect(result.dcqlPayload).toBeDefined()
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].format).toBe('dc+sd-jwt')
    if (result.dcqlPayload?.dcqlQuery.credentials[0].format === 'dc+sd-jwt') {
      expect(result.dcqlPayload.dcqlQuery.credentials[0].meta?.vct_values).toContain('clubcard-v1')
    }
    expect(result.dcqlPayload?.dcqlQuery.credentials[0].claims).toHaveLength(4)
  })

  it('should get definitions with dcqlPayload by filter', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'ajax-club',
      version: '1.0',
      definitionPayload: { id: 'ajax-club', input_descriptors: [] },
      dcqlPayload: SAMPLE_DCQL_QUERY_PAYLOAD,
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    const args: GetDefinitionsArgs = {
      filter: [{ definitionId: 'ajax-club' }],
    }
    const result: Array<PresentationDefinitionItem> = await pdStore.getDefinitions(args)

    expect(result.length).toEqual(1)
    expect(result[0].dcqlPayload).toBeDefined()
    expect(result[0].dcqlPayload?.dcqlQuery.credentials[0].id).toEqual('clubcard-v1')
  })

  it('should delete definition', async (): Promise<void> => {
    const definition: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition: PresentationDefinitionItem = await pdStore.addDefinition(definition)
    expect(savedDefinition).toBeDefined()

    await pdStore.deleteDefinition({ itemId: savedDefinition.id })

    await expect(pdStore.getDefinition({ itemId: savedDefinition.id })).rejects.toThrow(
      `No presentation definition item found for id: ${savedDefinition.id}`,
    )
  })

  it('should delete definitions by filter', async (): Promise<void> => {
    const definition1: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition1',
      version: '1.0',
      definitionPayload: { id: 'definition1', input_descriptors: [] },
    }
    const savedDefinition1: PresentationDefinitionItem = await pdStore.addDefinition(definition1)
    expect(savedDefinition1).toBeDefined()

    const definition2: NonPersistedPresentationDefinitionItem = {
      definitionId: 'definition2',
      version: '1.0',
      definitionPayload: { id: 'definition2', input_descriptors: [] },
    }
    const savedDefinition2: PresentationDefinitionItem = await pdStore.addDefinition(definition2)
    expect(savedDefinition2).toBeDefined()

    const filter = { filter: [{ definitionId: 'definition1' }] }
    await pdStore.deleteDefinitions(filter)

    const remainingDefinitions: Array<PresentationDefinitionItem> = await pdStore.getDefinitions({})
    expect(remainingDefinitions.length).toEqual(1)
    expect(remainingDefinitions[0].definitionId).toEqual('definition2')
  })
})
