import { TAgent } from '@veramo/core'
import { GetDefinitionItemsArgs, IPDManager, PersistDefinitionArgs } from '../../src'
import { IPresentationDefinition } from '@sphereon/pex'
import * as fs from 'fs'
import { PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

type ConfiguredAgent = TAgent<IPDManager>

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('PD Manager Agent Plugin', (): void => {
    const singleDefinition: IPresentationDefinition = getFileAsJson('./packages/pd-manager/__tests__/fixtures/pd_single.json')

    let agent: ConfiguredAgent
    let defaultDefinitionItem: PresentationDefinitionItem

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      const definition: PersistDefinitionArgs = {
        definitionItem: {
          definitionId: 'default_definition_id',
          version: '1.0.0',
          definitionPayload: singleDefinition,
        },
      }

      defaultDefinitionItem = await agent.pdmPersistDefinition(definition)
    })

    afterAll(testContext.tearDown)

    it('should check if a definition item exists by id', async (): Promise<void> => {
      const result: boolean = await agent.pdmHasDefinition({ itemId: defaultDefinitionItem.id })

      expect(result).toBe(true)
    })

    it('should get definition item by id', async (): Promise<void> => {
      const result: PresentationDefinitionItem = await agent.pdmGetDefinition({ itemId: defaultDefinitionItem.id })

      expect(result.id).toEqual(defaultDefinitionItem.id)
    })

    it('should return false when checking for a non-existing definition item by id', async (): Promise<void> => {
      const itemId = 'unknownItemId'
      const result: boolean = await agent.pdmHasDefinition({ itemId })

      expect(result).toBe(false)
    })

    it('should check if any definition items exist by filter', async (): Promise<void> => {
      const args: GetDefinitionItemsArgs = {
        filter: [
          {
            definitionId: 'default_definition_id',
          },
        ],
      }
      const result: boolean = await agent.pdmHasDefinitions(args)

      expect(result).toBe(true)
    })

    it('should throw error when getting definition item with unknown id', async (): Promise<void> => {
      const itemId = 'unknownItemId'

      await expect(agent.pdmGetDefinition({ itemId })).rejects.toThrow(`No presentation definition item found for id: ${itemId}`)
    })

    it('should get all definition items', async (): Promise<void> => {
      const result: Array<PresentationDefinitionItem> = await agent.pdmGetDefinitions({})

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get definition items by filter', async (): Promise<void> => {
      const args: GetDefinitionItemsArgs = {
        filter: [
          {
            definitionId: 'default_definition_id',
          },
        ],
      }
      const result: Array<PresentationDefinitionItem> = await agent.pdmGetDefinitions(args)

      expect(result.length).toBe(1)
    })

    it('should add definition item', async (): Promise<void> => {
      const definition: PersistDefinitionArgs = {
        definitionItem: {
          definitionId: 'new_definition_id',
          version: '1.0.0',
          definitionPayload: singleDefinition,
        },
      }

      const result: PresentationDefinitionItem = await agent.pdmPersistDefinition(definition)

      expect(result.definitionId).toEqual(definition.definitionItem.definitionId)
      expect(result.version).toEqual(definition.definitionItem.version)
    })

    it('should update definition item by id', async (): Promise<void> => {
      const updatedDefinitionItem: PresentationDefinitionItem = {
        ...defaultDefinitionItem,
      }
      updatedDefinitionItem.definitionPayload.input_descriptors[0].id = 'Updated Credential'
      const result: PresentationDefinitionItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'Overwrite' },
      })

      expect(result.definitionPayload.input_descriptors.length).toEqual(1)
      expect(result.definitionPayload.input_descriptors[0].id).toEqual('Updated Credential')
    })

    it('should create a new major version of the definition item', async (): Promise<void> => {
      const updatedDefinitionItem: PresentationDefinitionItem = {
        ...defaultDefinitionItem,
      }
      updatedDefinitionItem.definitionPayload.input_descriptors[0].id = 'New major version'
      const result: PresentationDefinitionItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
      })

      expect(result.version).toEqual('2.0.0')
      expect(result.definitionPayload.input_descriptors.length).toEqual(1)
      expect(result.definitionPayload.input_descriptors[0].id).toEqual('New major version')

      defaultDefinitionItem.version = result.version
    })

    it('should create a new minor version of the definition item', async (): Promise<void> => {
      const updatedDefinitionItem: PresentationDefinitionItem = {
        ...defaultDefinitionItem,
      }
      updatedDefinitionItem.definitionPayload.input_descriptors[0].id = 'New minor version'
      const result: PresentationDefinitionItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'AutoIncrementMinor' },
      })

      expect(result.version).toEqual('2.1.0')
      expect(result.definitionPayload.input_descriptors.length).toEqual(1)
      expect(result.definitionPayload.input_descriptors[0].id).toEqual('New minor version')
    })

    it('should delete definition item by id', async (): Promise<void> => {
      const result = await agent.pdmDeleteDefinition({ itemId: defaultDefinitionItem.id })

      expect(result).toBe(true)
    })

    it('should throw error when deleting definition item with unknown id', async (): Promise<void> => {
      const itemId = 'unknownItemId'

      await expect(agent.pdmDeleteDefinition({ itemId })).rejects.toThrow(`No presentation definition found with id: ${itemId}`)
    })

    it('should return false when checking for non-existing definition items by filter', async (): Promise<void> => {
      const args: GetDefinitionItemsArgs = {
        filter: [
          {
            definitionId: 'non_existing_definition_id',
          },
        ],
      }
      const result: boolean = await agent.pdmHasDefinitions(args)

      expect(result).toBe(false)
    })

    it('should delete multiple definition items by filter', async (): Promise<void> => {
      const args: GetDefinitionItemsArgs = {
        filter: [
          {
            definitionId: 'default_definition_id',
          },
        ],
      }
      await agent.pdmDeleteDefinitions(args)

      const result: boolean = await agent.pdmHasDefinitions(args)
      expect(result).toBe(false)
    })
  })
}
