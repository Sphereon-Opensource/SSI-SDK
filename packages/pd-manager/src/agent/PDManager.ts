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
  'pdmGetDefinition',
  'pdmGetDefinitions',
  'pdmAddDefinition',
  'pdmUpdateDefinition',
  'pdmRemoveDefinition',
  'pdmPersistDefinition',
]

/**
 * {@inheritDoc IPDManager}
 */
export class PDManager implements IAgentPlugin {
  readonly schema = schema.IPDManager
  readonly methods: IPDManager = {
    pdmGetDefinition: this.pdmGetDefinition.bind(this),
    pdmGetDefinitions: this.pdmGetDefinitions.bind(this),
    pdmAddDefinition: this.pdmAddDefinition.bind(this),
    pdmUpdateDefinition: this.pdmUpdateDefinition.bind(this),
    pdmDeleteDefinition: this.pdmDeleteDefinition.bind(this),
    pdmPersistDefinition: this.pdmPersistDefinition.bind(this),
  }

  private readonly store: AbstractPDStore

  constructor(options: { store: AbstractPDStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IPDManager.pdmGetDefinition} */
  private async pdmGetDefinition(args: GetDefinitionItemArgs): Promise<PresentationDefinitionItem> {
    const { itemId } = args
    return this.store.getDefinition({ itemId })
  }

  /** {@inheritDoc IPDManager.pdmGetDefinition} */
  private async pdmGetDefinitions(args: GetDefinitionsItemArgs): Promise<Array<PresentationDefinitionItem>> {
    const { filter } = args
    return this.store.getDefinitions({ filter })
  }

  /** {@inheritDoc IPDManager.pdmAddDefinition} */
  private async pdmAddDefinition(args: NonPersistedPresentationDefinitionItem): Promise<PresentationDefinitionItem> {
    return this.store.addDefinition(args)
  }

  /** {@inheritDoc IPDManager.pdmUpdateDefinition} */
  private async pdmUpdateDefinition(args: UpdateDefinitionItemArgs): Promise<PresentationDefinitionItem> {
    return this.store.updateDefinition(args.definitionItem)
  }

  /** {@inheritDoc IPDManager.pdmDeleteDefinition} */
  private async pdmDeleteDefinition(args: DeleteDefinitionItemArgs): Promise<boolean> {
    return this.store.deleteDefinition(args).then((): boolean => true)
  }

  /** {@inheritDoc IPDManager.pdmPersistDefinition} */
  private async pdmPersistDefinition(args: PersistDefinitionArgs): Promise<PresentationDefinitionItem> {
    const { definitionItem, versionControlMode = 'AutoIncrementMajor' } = args
    const { version, tenantId } = definitionItem
    const definitionId = definitionItem.definitionId ?? definitionItem.definitionPayload.id

    const nonPersistedDefinitionItem: NonPersistedPresentationDefinitionItem = {
      ...definitionItem,
      definitionId: definitionId,
      version: definitionItem.version ?? '1',
    }

    const existing = await this.store.getDefinitions({ filter: [{ definitionId, tenantId, version }] })
    const existingItem = existing[0]
    let latestVersionItem: PresentationDefinitionItem | undefined = existingItem

    if (existingItem && version) {
      const latest = await this.store.getDefinitions({ filter: [{ definitionId, tenantId }] })
      latestVersionItem = latest[0] ?? existingItem
    }

    const isPayloadModified = !existingItem || !isPresentationDefinitionEqual(existingItem, definitionItem)
    if (!isPayloadModified) return existingItem

    switch (versionControlMode) {
      case 'Overwrite':
        return this.handleOverwriteMode(existingItem, nonPersistedDefinitionItem, version)
      case 'OverwriteLatest':
        return this.handleOverwriteLatestMode(latestVersionItem, nonPersistedDefinitionItem)
      case 'Manual':
        return this.handleManualMode(existingItem, nonPersistedDefinitionItem, tenantId, version)
      case 'AutoIncrementMajor':
        return this.handleAutoIncrementMode(latestVersionItem, nonPersistedDefinitionItem, 'major')
      case 'AutoIncrementMinor':
        return this.handleAutoIncrementMode(latestVersionItem, nonPersistedDefinitionItem, 'minor')
      default:
        throw new Error(`Unknown version control mode: ${versionControlMode}`)
    }
  }

  private async handleOverwriteMode(
    existingItem: PresentationDefinitionItem | undefined,
    definitionItem: NonPersistedPresentationDefinitionItem,
    version: string | undefined,
  ): Promise<PresentationDefinitionItem> {
    if (existingItem) {
      existingItem.definitionId = definitionItem.definitionId
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
  ): Promise<PresentationDefinitionItem> {
    if (latestVersionItem) {
      latestVersionItem.definitionId = definitionItem.definitionId
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
    tenantId: string | undefined,
    version: string | undefined,
  ): Promise<PresentationDefinitionItem> {
    if (existingItem && !isPresentationDefinitionEqual(existingItem, definitionItem)) {
      throw Error(
        `Cannot update definition ${definitionItem.definitionId} for tenant ${tenantId} version ${version} because definition exists and manual version control is enabled.`,
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
