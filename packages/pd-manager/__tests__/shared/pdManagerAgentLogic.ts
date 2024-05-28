import { TAgent } from '@veramo/core'
import { AddDefinitionItemArgs, GetDefinitionsItemArgs, IPDManager } from '../../src'
import { IPresentationDefinition } from '@sphereon/pex'
import * as fs from 'fs'
import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

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

      const definition: AddDefinitionItemArgs = {
        definitionId: 'default_definition_id',
        version: '1.0.0',
        definitionPayload: {
          id: 'default_definition_id',
          input_descriptors: [],
        },
      }

      defaultDefinitionItem = await agent.pdmAddDefinitionItem(definition)
    })

    afterAll(testContext.tearDown)

    it('should get definition item by id', async (): Promise<void> => {
      const result: PresentationDefinitionItem = await agent.pdmGetDefinitionItem({ itemId: defaultDefinitionItem.id })

      expect(result.id).toEqual(defaultDefinitionItem.id)
    })

    it('should throw error when getting definition item with unknown id', async (): Promise<void> => {
      const itemId = 'unknownItemId'

      await expect(agent.pdmGetDefinitionItem({ itemId })).rejects.toThrow(`No presentation definition item found for id: ${itemId}`)
    })

    it('should get all definition items', async (): Promise<void> => {
      const result: Array<PresentationDefinitionItem> = await agent.pdmGetDefinitionsItem({})

      expect(result.length).toBeGreaterThan(0)
    })

    it('should get definition items by filter', async (): Promise<void> => {
      const args: GetDefinitionsItemArgs = {
        filter: [
          {
            definitionId: 'default_definition_id',
          },
        ],
      }
      const result: Array<PresentationDefinitionItem> = await agent.pdmGetDefinitionsItem(args)

      expect(result.length).toBe(1)
    })

    it('should add definition item', async (): Promise<void> => {
      const definition: NonPersistedPresentationDefinitionItem = {
        definitionId: 'new_definition_id',
        version: '1.0.0',
        definitionPayload: {
          id: 'new_definition_id',
          input_descriptors: [],
        },
      }

      const result: PresentationDefinitionItem = await agent.pdmAddDefinitionItem(definition)

      expect(result.definitionId).toEqual(definition.definitionId)
      expect(result.version).toEqual(definition.version)
    })

    it('should update definition item by id', async (): Promise<void> => {
      const result: PresentationDefinitionItem = await agent.pdmUpdateDefinitionItem({
        definitionItem: {
          ...defaultDefinitionItem,
          definitionPayload: singleDefinition,
        },
      })

      expect(result.definitionPayload.input_descriptors.length).toEqual(1)
      expect(result.definitionPayload.input_descriptors[0].id).toEqual('ID Card Credential')
    })

    it('should throw error when updating definition item with unknown id', async (): Promise<void> => {
      const definitionItem = {
        ...defaultDefinitionItem,
        id: 'unknownItemId',
      }

      await expect(agent.pdmUpdateDefinitionItem({ definitionItem })).rejects.toThrow(`No presentation definition item found for id: unknownItemId`)
    })

    it('should delete definition item by id', async (): Promise<void> => {
      const result = await agent.pdmDeleteDefinitionItem({ itemId: defaultDefinitionItem.id })

      expect(result).toBe(true)
    })

    it('should throw error when deleting definition item with unknown id', async (): Promise<void> => {
      const itemId = 'unknownItemId'

      await expect(agent.pdmDeleteDefinitionItem({ itemId })).rejects.toThrow(`No presentation definition found with id: ${itemId}`)
    })
  })
}
