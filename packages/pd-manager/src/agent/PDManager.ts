import { IAgentPlugin } from '@veramo/core'
import {
  DeleteDefinitionItemArgs,
  DeleteDefinitionItemsArgs,
  GetDefinitionItemArgs,
  GetDefinitionItemsArgs,
  HasDefinitionItemArgs,
  HasDefinitionItemsArgs,
  IPDManager,
  PersistDefinitionArgs,
  schema,
} from '../index'
import {
  AbstractPDStore,
  isPresentationDefinitionEqual,
  NonPersistedPresentationDefinitionItem,
  PresentationDefinitionItem,
} from '@sphereon/ssi-sdk.data-store'
import semver from 'semver/preload'
import { ReleaseType } from 'semver'

// Exposing the methods here for any REST implementation
export const pdManagerMethods: Array<string> = [
  'pdmHasDefinition',
  'pdmHasGetDefinitions',
  'pdmGetDefinition',
  'pdmGetDefinitions',
  'pdmPersistDefinition',
  'pdmDeleteDefinition',
  'pdmDeleteDefinitions',
]

/**
 * {@inheritDoc IPDManager}
 */
export class PDManager implements IAgentPlugin {
  readonly schema = schema.IPDManager
  readonly methods: IPDManager = {
    pdmPersistDefinition: this.pdmPersistDefinition.bind(this),
    pdmHasDefinition: this.pdmHasDefinition.bind(this),
    pdmHasDefinitions: this.pdmHasDefinitions.bind(this),
    pdmGetDefinition: this.pdmGetDefinition.bind(this),
    pdmGetDefinitions: this.pdmGetDefinitions.bind(this),
    pdmDeleteDefinition: this.pdmDeleteDefinition.bind(this),
    pdmDeleteDefinitions: this.pdmDeleteDefinitions.bind(this),
  }

  private readonly store: AbstractPDStore

  constructor(options: { store: AbstractPDStore }) {
    this.store = options.store
  }

  /** {@inheritDoc IPDManager.pdmHasDefinition} */
  private async pdmHasDefinition(args: HasDefinitionItemArgs): Promise<boolean> {
    const { itemId } = args
    return this.store.hasDefinition({ itemId })
  }

  /** {@inheritDoc IPDManager.pdmHasDefinitions} */
  private async pdmHasDefinitions(args: HasDefinitionItemsArgs): Promise<boolean> {
    const { filter } = args
    return this.store.hasDefinitions({ filter })
  }

  /** {@inheritDoc IPDManager.pdmGetDefinition} */
  private async pdmGetDefinition(args: GetDefinitionItemArgs): Promise<PresentationDefinitionItem> {
    const { itemId } = args
    return this.store.getDefinition({ itemId })
  }

  /** {@inheritDoc IPDManager.pdmGetDefinitions} */
  private async pdmGetDefinitions(args: GetDefinitionItemsArgs): Promise<Array<PresentationDefinitionItem>> {
    const { filter, opts } = args
    const allDefinitions = await this.store.getDefinitions({ filter })
    let definitions: PresentationDefinitionItem[] = []
    if (opts == undefined || opts.showVersionHistory !== true) {
      const groupedByDefinitionId = allDefinitions.reduce(
        (acc, entity) => {
          if (!acc[entity.definitionId]) {
            acc[entity.definitionId] = []
          }
          acc[entity.definitionId].push(entity)
          return acc
        },
        {} as Record<string, PresentationDefinitionItem[]>,
      )
      definitions = Object.values(groupedByDefinitionId).map((entities) =>
        entities.reduce((highestVersionItem, baseItem) => {
          const baseVersion = this.normalizeToSemverVersionFormat(baseItem.version)
          const highestVersion = this.normalizeToSemverVersionFormat(highestVersionItem.version)
          return semver.gt(baseVersion, highestVersion) ? baseItem : highestVersionItem
        }),
      )
    } else {
      definitions = allDefinitions
    }
    return definitions
  }

  /** {@inheritDoc IPDManager.pdmDeleteDefinition} */
  private async pdmDeleteDefinition(args: DeleteDefinitionItemArgs): Promise<boolean> {
    return this.store.deleteDefinition(args).then((value) => true)
  }

  /** {@inheritDoc IPDManager.pdmDeleteDefinitions} */
  private async pdmDeleteDefinitions(args: DeleteDefinitionItemsArgs): Promise<number> {
    return this.store.deleteDefinitions(args)
  }

  /** {@inheritDoc IPDManager.pdmPersistDefinition} */
  private async pdmPersistDefinition(args: PersistDefinitionArgs): Promise<PresentationDefinitionItem> {
    const { definitionItem, opts } = args
    const { versionControlMode, versionIncrementReleaseType } = opts ?? { versionControlMode: 'AutoIncrement' }
    const { version, tenantId } = definitionItem
    const definitionId = definitionItem.definitionId ?? definitionItem.definitionPayload.id

    let { id } = definitionItem
    if (id !== undefined && versionControlMode !== 'Overwrite') {
      id = undefined
    }

    const nonPersistedDefinitionItem: NonPersistedPresentationDefinitionItem = {
      ...definitionItem,
      definitionId: definitionId,
      version: version ?? '1',
    }

    const existing = await this.store.getDefinitions({ filter: [{ id, definitionId, tenantId, version }] })
    const existingItem = existing[0]
    let latestVersionItem: PresentationDefinitionItem | undefined = existingItem

    if (existingItem && version) {
      const latest = await this.store.getDefinitions({ filter: [{ id, definitionId, tenantId }] })
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
      case 'AutoIncrement':
        return this.handleAutoIncrementMode(latestVersionItem, nonPersistedDefinitionItem, versionIncrementReleaseType ?? 'major')
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
      existingItem.name = definitionItem.definitionPayload.name ?? definitionItem.name
      existingItem.purpose = definitionItem.definitionPayload.purpose ?? definitionItem.purpose
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
      latestVersionItem.name = definitionItem.name
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
    releaseType: ReleaseType,
  ): Promise<PresentationDefinitionItem> {
    const defaultVersion = '1'
    let currentVersion = latestVersionItem?.version ?? definitionItem.version ?? defaultVersion
    let resultVersion: string

    if (!latestVersionItem) {
      resultVersion = currentVersion
    } else {
      let [baseVersion, preReleaseSuffix] = currentVersion.split(/-(.+)/)

      // Normalize the base version to at least 'major.minor.patch', that's what semver needs as input
      let normalizedBaseVersion = semver.coerce(baseVersion)?.version ?? `${defaultVersion}.0.0`
      let preReleaseIdentifier = preReleaseSuffix ? preReleaseSuffix.match(/^[a-zA-Z]+/)?.[0] : undefined
      let fullVersionToIncrement = preReleaseIdentifier ? `${normalizedBaseVersion}-${preReleaseSuffix}` : normalizedBaseVersion

      // Use semver to increment the version
      let incrementedVersion = semver.inc(fullVersionToIncrement, releaseType, preReleaseIdentifier)
      if (!incrementedVersion) {
        throw new Error(`Could not increment ${releaseType} version on ${currentVersion} ${preReleaseSuffix}`)
      }

      // Extract new base version to match the original input format
      let [incrementedBaseVersion, incrementedSuffix] = incrementedVersion.split(/-(.+)/)
      let originalParts = baseVersion.split('.')
      let newParts = incrementedBaseVersion.split('.')
      while (newParts.length > originalParts.length) {
        newParts.pop() // Reduce to original length by removing extra .0s
      }
      resultVersion = newParts.join('.')
      if (incrementedSuffix) {
        resultVersion += `-${incrementedSuffix}`
      }
    }

    definitionItem.version = resultVersion
    return await this.store.addDefinition(definitionItem)
  }

  private normalizeToSemverVersionFormat(version: string): string {
    const defaultVersion = '1.0.0'
    let [baseVersion, preReleaseSuffix] = version.split(/-(.+)/)

    // Normalize the base version to at least 'major.minor.patch', that's what semver needs as input
    let normalizedBaseVersion = semver.coerce(baseVersion)?.version ?? defaultVersion
    if (preReleaseSuffix) {
      normalizedBaseVersion += `-${preReleaseSuffix}`
    }

    return normalizedBaseVersion
  }
}
