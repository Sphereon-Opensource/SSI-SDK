import { IAgentPlugin } from '@veramo/core'
import {
  DeleteDefinitionItemArgs,
  GetDefinitionItemArgs,
  GetDefinitionsItemArgs,
  IPDManager,
  PersistDefinitionArgs,
  schema,
  UpdateDefinitionItemArgs,
} from '../index'
import {
  AbstractPDStore,
  isPresentationDefinitionEqual,
  NonPersistedPresentationDefinitionItem,
  PresentationDefinitionItem,
} from '@sphereon/ssi-sdk.data-store'
import semver from 'semver/preload'

// Exposing the methods here for any REST implementation
export const pdManagerMethods: Array<string> = [
  'pdmGetDefinitionItem',
  'pdmGetDefinitionItems',
  'pdmAddDefinitionItem',
  'pdmUpdateDefinitionItem',
  'pdmRemoveDefinitionItem',
  'pdmPersistDefinition',
]

/**
 * {@inheritDoc IPDManager}
 */
export class PDManager implements IAgentPlugin {
  readonly schema = schema.IPDManager
  readonly methods: IPDManager = {
    pdmGetDefinitionItem: this.pdmGetDefinitionItem.bind(this),
    pdmGetDefinitionsItem: this.pdmGetDefinitionsItems.bind(this),
    pdmAddDefinitionItem: this.pdmAddDefinitionItem.bind(this),
    pdmUpdateDefinitionItem: this.pdmUpdateDefinitionItem.bind(this),
    pdmDeleteDefinitionItem: this.pdmDeleteDefinitionItem.bind(this),
    pdmPersistDefinition: this.pdmPersistDefinition.bind(this),
  }

  private readonly store: AbstractPDStore

  constructor(options: { store: AbstractPDStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IPDManager.pdmGetDefinitionItem} */
  private async pdmGetDefinitionItem(args: GetDefinitionItemArgs): Promise<PresentationDefinitionItem> {
    const { itemId } = args
    return this.store.getDefinition({ itemId })
  }

  /** {@inheritDoc IPDManager.pdmGetDefinitionItems} */
  private async pdmGetDefinitionsItems(args: GetDefinitionsItemArgs): Promise<Array<PresentationDefinitionItem>> {
    const { filter } = args
    return this.store.getDefinitions({ filter })
  }

  /** {@inheritDoc IPDManager.pdmAddDefinitionItem} */
  private async pdmAddDefinitionItem(args: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem> {
    return this.store.addDefinition(args)
  }

  /** {@inheritDoc IPDManager.pdmUpdateDefinitionItem} */
  private async pdmUpdateDefinitionItem(args: UpdateDefinitionItemArgs): Promise<PresentationDefinitionItem> {
    return this.store.updateDefinition(args.definitionItem)
  }

  /** {@inheritDoc IPDManager.pdmDeleteDefinitionItem} */
  private async pdmDeleteDefinitionItem(args: DeleteDefinitionItemArgs): Promise<boolean> {
    return this.store.deleteDefinition(args).then((): boolean => true)
  }

  /** {@inheritDoc IPDManager.pdmPersistDefinition} */
  private async pdmPersistDefinition(args: PersistDefinitionArgs): Promise<PresentationDefinitionItem> {
    const { definition, version, tenantId, versionControlMode = 'AutoIncrementMajor' } = args
    const existing = await this.store.getDefinitions({ filter: [{ definitionId: definition.id, tenantId, version }] })
    const existingItem = existing.length > 0 ? existing[0] : undefined
    let latestVersionItem: PresentationDefinitionItem | undefined = existingItem

    if (existingItem && version) {
      const latest = await this.store.getDefinitions({ filter: [{ definitionId: definition.id, tenantId }] })
      latestVersionItem = latest.length > 0 ? latest[0] : existingItem
    }

    const definitionItem: NonPersistedPresentationDefinitionItem = {
      definitionId: definition.id,
      version: version ?? '1',
      tenantId: tenantId,
      purpose: definition.purpose,
      definitionPayload: definition,
    }

    const isPayloadModified = existingItem === undefined || !isPresentationDefinitionEqual(existingItem, definitionItem)
    if (!isPayloadModified) {
      return existingItem
    }

    switch (versionControlMode) {
      case 'Overwrite':
        return this.handleOverwriteMode(existingItem, definitionItem, definition.id, version)

      case 'OverwriteLatest':
        return this.handleOverwriteLatestMode(latestVersionItem, definitionItem, definition.id)

      case 'Manual':
        return this.handleManualMode(existingItem, definitionItem, definition.id, tenantId, version)

      case 'AutoIncrementMajor':
        return this.handleAutoIncrementMode(latestVersionItem, definitionItem, 'major')

      case 'AutoIncrementMinor':
        return this.handleAutoIncrementMode(latestVersionItem, definitionItem, 'minor')

      default:
        throw Error(`Unknown version control mode: ${versionControlMode}`)
    }
  }

  private async handleOverwriteMode(
    existingItem: PresentationDefinitionItem | undefined,
    definitionItem: NonPersistedPresentationDefinitionItem,
    definitionId: string,
    version: string | undefined,
  ): Promise<PresentationDefinitionItem> {
    if (existingItem) {
      existingItem.definitionId = definitionId
      existingItem.version = version ?? existingItem.version ?? '1'
      existingItem.tenantId = definitionItem.tenantId
      existingItem.purpose = definitionItem.purpose
      existingItem.definitionPayload = definitionItem.definitionPayload

      return await this.store.updateDefinition(existingItem)
    } else {
      return await this.store.addDefinition(definitionItem)
    }
  }

  private async handleOverwriteLatestMode(
    latestVersionItem: PresentationDefinitionItem | undefined,
    definitionItem: NonPersistedPresentationDefinitionItem,
    definitionId: string,
  ): Promise<PresentationDefinitionItem> {
    if (latestVersionItem) {
      latestVersionItem.definitionId = definitionId
      latestVersionItem.tenantId = definitionItem.tenantId
      latestVersionItem.purpose = definitionItem.purpose
      latestVersionItem.definitionPayload = definitionItem.definitionPayload

      return await this.store.updateDefinition(latestVersionItem)
    } else {
      return await this.store.addDefinition(definitionItem)
    }
  }

  private async handleManualMode(
    existingItem: PresentationDefinitionItem | undefined,
    definitionItem: NonPersistedPresentationDefinitionItem,
    definitionId: string,
    tenantId: string | undefined,
    version: string | undefined,
  ): Promise<PresentationDefinitionItem> {
    if (existingItem && !isPresentationDefinitionEqual(existingItem, definitionItem)) {
      throw Error(
        `Cannot update definition ${definitionId} for tenant ${tenantId} version ${version} because definition exists and manual version control is enabled.`,
      )
    } else {
      return await this.store.addDefinition(definitionItem)
    }
  }

  private async handleAutoIncrementMode(
    latestVersionItem: PresentationDefinitionItem | undefined,
    definitionItem: NonPersistedPresentationDefinitionItem,
    releaseType: 'major' | 'minor',
  ): Promise<PresentationDefinitionItem> {
    definitionItem.version = latestVersionItem ? semver.inc(latestVersionItem.version, releaseType) ?? '1' : '1'
    return await this.store.addDefinition(definitionItem)
  }
}
