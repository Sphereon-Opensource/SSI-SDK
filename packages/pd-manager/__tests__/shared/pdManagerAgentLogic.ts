import { DcqlQueryItem, ImportDcqlQueryItem, NonPersistedDcqlQueryItem } from '@sphereon/ssi-sdk.data-store'
import { TAgent } from '@veramo/core'
import { DcqlQuery } from 'dcql'
import * as fs from 'fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GetDcqlQueryItemsArgs, IPDManager, PersistDcqlQueryArgs, PersistDcqlQueryItem } from '../../src'

type ConfiguredAgent = TAgent<IPDManager>

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('PD Manager Agent Plugin', (): void => {
    const sampleDcql: ImportDcqlQueryItem = {
      queryId: 'credential1',
      query: DcqlQuery.parse({
        credentials: [
          {
            id: 'credential1',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['test', `testClaim`],
              },
            ],
          },
        ],
      }),
    }

    let agent: ConfiguredAgent
    let defaultDefinitionItem: DcqlQueryItem

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()

      const definition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'default_definition_id',
          query: sampleDcql.query,
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
      const result: DcqlQueryItem = await agent.pdmGetDefinition({ itemId: defaultDefinitionItem.id })

      expect(result.id).toEqual(defaultDefinitionItem.id)
    })

    it('should return false when checking for a non-existing definition item by id', async (): Promise<void> => {
      const itemId = 'unknownItemId'
      const result: boolean = await agent.pdmHasDefinition({ itemId })

      expect(result).toBe(false)
    })

    it('should check if any definition items exist by filter', async (): Promise<void> => {
      const args: GetDcqlQueryItemsArgs = {
        filter: [
          {
            queryId: 'default_definition_id',
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

    it('should get definition items by filter', async (): Promise<void> => {
      const args: GetDcqlQueryItemsArgs = {
        filter: [
          {
            queryId: 'default_definition_id',
          },
        ],
      }
      const result: Array<DcqlQueryItem> = await agent.pdmGetDefinitions(args)

      expect(result.length).toBe(1)
    })

    it('should add definition item with default version', async (): Promise<void> => {
      const definition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'new_definition_id',
          query: DcqlQuery.parse({
            credentials: [
              {
                id: 'new_credential',
                format: 'dc+sd-jwt',
                require_cryptographic_holder_binding: true,
                multiple: false,
                claims: [
                  {
                    path: ['test', 'newClaim'],
                  },
                ],
              },
            ],
          }),
        },
      }

      const result: DcqlQueryItem = await agent.pdmPersistDefinition(definition)

      expect(result.queryId).toEqual(definition.definitionItem.queryId)
      expect(result.version).toEqual('1')
    })

    it('should update definition item by id', async (): Promise<void> => {
      const updatedDefinitionItem: DcqlQueryItem = {
        ...defaultDefinitionItem,
      }
      updatedDefinitionItem.query = DcqlQuery.parse({
        credentials: [
          {
            id: 'updated_credential',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['test', 'updatedClaim'],
              },
            ],
          },
        ],
      })
      const result: DcqlQueryItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'Overwrite' },
      })

      expect(result.query.credentials.length).toEqual(1)
      expect(result.query.credentials[0].id).toEqual('updated_credential')
    })

    it('should create a new major version of the default definition item', async (): Promise<void> => {
      const updatedDefinitionItem: DcqlQueryItem = {
        ...defaultDefinitionItem,
      }
      updatedDefinitionItem.query = DcqlQuery.parse({
        credentials: [
          {
            id: 'major_version_credential',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['test', 'majorVersionClaim'],
              },
            ],
          },
        ],
      })
      const result: DcqlQueryItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
      })

      expect(result.version).toEqual('2')
      expect(result.query.credentials.length).toEqual(1)
      expect(result.query.credentials[0].id).toEqual('major_version_credential')

      defaultDefinitionItem.version = result.version
    })

    let versionedDefinitionItem: DcqlQueryItem
    it('should add definition item v1.0.0', async (): Promise<void> => {
      const definition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'versioned_definition_id',
          version: '1.0.0',
          query: DcqlQuery.parse({
            credentials: [
              {
                id: 'versioned_credential',
                format: 'dc+sd-jwt',
                require_cryptographic_holder_binding: true,
                multiple: false,
                claims: [
                  {
                    path: ['test', 'versionedClaim'],
                  },
                ],
              },
            ],
          }),
        },
      }

      versionedDefinitionItem = await agent.pdmPersistDefinition(definition)

      expect(versionedDefinitionItem.queryId).toEqual(definition.definitionItem.queryId)
      expect(versionedDefinitionItem.version).toEqual(definition.definitionItem.version)
    })

    it('should increment major versions up to 12.0.0', async (): Promise<void> => {
      let currentItem = { ...versionedDefinitionItem } as PersistDcqlQueryItem

      for (let i = 2; i <= 12; i++) {
        currentItem.name = 'Credential Name'
        currentItem.purpose = 'Credential Purpose'
        currentItem.query = DcqlQuery.parse({
          credentials: [
            {
              id: `credential-v${i}`,
              format: 'dc+sd-jwt',
              require_cryptographic_holder_binding: true,
              multiple: false,
              claims: [
                {
                  path: ['test', `claim-v${i}`],
                },
              ],
            },
          ],
        })
        currentItem.version = undefined
        const result = await agent.pdmPersistDefinition({
          definitionItem: currentItem,
          opts: { versionControlMode: 'AutoIncrement', versionIncrementReleaseType: 'major' },
        })

        expect(result.version).toEqual(`${i}.0.0`)
        expect(result.query).toBeTruthy()
        expect(result.query.credentials[0].id).toEqual(`credential-v${i}`)
        expect(result.name).toEqual('Credential Name')
        expect(result.purpose).toEqual('Credential Purpose')

        currentItem = result
      }

      versionedDefinitionItem = currentItem as DcqlQueryItem
    })

    it('should create a new minor version of the definition item', async (): Promise<void> => {
      const updatedDefinitionItem: DcqlQueryItem = {
        ...versionedDefinitionItem,
      }
      updatedDefinitionItem.query = DcqlQuery.parse({
        credentials: [
          {
            id: 'minor_version_credential',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['test', 'minorVersionClaim'],
              },
            ],
          },
        ],
      })
      const result: DcqlQueryItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'AutoIncrement', versionIncrementReleaseType: 'minor' },
      })

      expect(result.version).toEqual('12.1.0')
      expect(result.query.credentials.length).toEqual(1)
      expect(result.query.credentials[0].id).toEqual('minor_version_credential')
    })

    let preReleaseVersionedDefinitionItem: DcqlQueryItem
    it('should add pre-release definition item v1.0.0-beta.1', async (): Promise<void> => {
      const definition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'pr_versioned_definition_id',
          version: '1.0.0-beta.1',
          query: DcqlQuery.parse({
            credentials: [
              {
                id: 'prerelease_credential',
                format: 'dc+sd-jwt',
                require_cryptographic_holder_binding: true,
                multiple: false,
                claims: [
                  {
                    path: ['test', 'prereleaseClaim'],
                  },
                ],
              },
            ],
          }),
        },
      }

      preReleaseVersionedDefinitionItem = await agent.pdmPersistDefinition(definition)

      expect(preReleaseVersionedDefinitionItem.queryId).toEqual(definition.definitionItem.queryId)
      expect(preReleaseVersionedDefinitionItem.version).toEqual(definition.definitionItem.version)
    })

    it('should create a new pre-release version of the definition item', async (): Promise<void> => {
      const updatedDefinitionItem: DcqlQueryItem = {
        ...preReleaseVersionedDefinitionItem,
      }
      updatedDefinitionItem.query = DcqlQuery.parse({
        credentials: [
          {
            id: 'prerelease_v2_credential',
            format: 'dc+sd-jwt',
            require_cryptographic_holder_binding: true,
            multiple: false,
            claims: [
              {
                path: ['test', 'prereleaseV2Claim'],
              },
            ],
          },
        ],
      })
      const result: DcqlQueryItem = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'AutoIncrement', versionIncrementReleaseType: 'prerelease' },
      })

      expect(result.version).toEqual('1.0.0-beta.2')
      expect(result.query.credentials.length).toEqual(1)
      expect(result.query.credentials[0].id).toEqual('prerelease_v2_credential')

      versionedDefinitionItem.version = result.version
    })

    it('should get all definition items including all version', async (): Promise<void> => {
      const result: Array<DcqlQueryItem> = await agent.pdmGetDefinitions({ opts: { showVersionHistory: true } })

      expect(result.length).toBe(18)
    })

    it('should get all definition items only containing the latest versions', async (): Promise<void> => {
      const result: Array<DcqlQueryItem> = await agent.pdmGetDefinitions({})

      expect(result.length).toBe(4)
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
      const args: GetDcqlQueryItemsArgs = {
        filter: [
          {
            queryId: 'non_existing_definition_id',
          },
        ],
      }
      const result: boolean = await agent.pdmHasDefinitions(args)

      expect(result).toBe(false)
    })

    it('should delete multiple definition items by filter', async (): Promise<void> => {
      const args: GetDcqlQueryItemsArgs = {
        filter: [
          {
            queryId: 'default_definition_id',
          },
        ],
      }
      await agent.pdmDeleteDefinitions(args)

      const result: boolean = await agent.pdmHasDefinitions(args)
      expect(result).toBe(false)
    })

    it('should add definition item with dcqlQuery', async (): Promise<void> => {
      const definition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'new_dcql_definition_id',
          query: sampleDcql.query,
        },
      }

      const result = await agent.pdmPersistDefinition(definition)

      expect(result.queryId).toEqual(definition.definitionItem.queryId)
      expect(result.query.credentials[0].id).toEqual('credential1')
    })

    it('should update dcqlQuery in definition item', async (): Promise<void> => {
      // First, create a definition with initial dcqlQuery
      const initialDefinition: PersistDcqlQueryArgs = {
        definitionItem: {
          queryId: 'dcql_update_test',
          query: DcqlQuery.parse({
            credentials: [
              {
                id: 'initial-credential',
                require_cryptographic_holder_binding: true,
                multiple: false,
                format: 'dc+sd-jwt',
                claims: [
                  {
                    path: ['test', 'initialClaim'],
                  },
                ],
              },
            ],
          }),
        },
      }

      const createdDefinition = await agent.pdmPersistDefinition(initialDefinition)

      // Now update it
      const updatedDcql = DcqlQuery.parse({
        credentials: [
          {
            id: 'credential2',
            format: 'dc+sd-jwt',
            multiple: false,
            require_cryptographic_holder_binding: true,
            claims: [
              {
                path: ['test', 'updatedClaim'],
              },
            ],
          },
        ],
      })

      const updatedDefinitionItem: NonPersistedDcqlQueryItem = {
        ...createdDefinition,
        query: updatedDcql,
      }

      const result = await agent.pdmPersistDefinition({
        definitionItem: updatedDefinitionItem,
        opts: { versionControlMode: 'Overwrite' },
      })

      expect(result.query.credentials[0].id).toEqual('credential2')
    })
  })
}
