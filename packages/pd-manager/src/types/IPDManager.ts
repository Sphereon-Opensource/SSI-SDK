import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FindDcqlQueryArgs, NonPersistedDcqlQueryItem, DcqlQueryItem } from '@sphereon/ssi-sdk.data-store'
import { ReleaseType } from 'semver'

export interface IPDManager extends IPluginMethodMap {
  /**
   * Get a single presentation definition records by primary key
   * @param args
   */
  pdmGetDefinition(args: GetDcqlQueryItemArgs): Promise<DcqlQueryItem>

  /**
   * Find one or more presentation definition records using filters
   * @param args
   */
  pdmGetDefinitions(args: GetDcqlQueryItemsArgs): Promise<Array<DcqlQueryItem>>

  /**
   * Checks whether a presentation definition record exists by primary key
   * @param args
   */
  pdmHasDefinition(args: HasDefinitionItemArgs): Promise<boolean>

  /**
   * Checks whether one or more presentation definition records exist using filters
   * @param args
   */
  pdmHasDefinitions(args: HasDcqlQueryItemsArgs): Promise<boolean>

  /**
   * Delete a single presentation definition records by primary key
   * @param args
   */
  pdmDeleteDefinition(args: DeleteDcqlQueryItemArgs): Promise<boolean>

  /**
   * Delete multiple presentation definitions records using filters
   * @param args
   */
  pdmDeleteDefinitions(args: DeleteDcqlQueryItemsArgs): Promise<number>

  /**
   * Check in a presentation definition.
   * It has version control logic which will add or update presentation definition records and has settings for automatic version numbering.
   * @param args
   */
  pdmPersistDefinition(args: PersistDcqlQueryArgs): Promise<DcqlQueryItem>
}

export type VersionControlMode = 'AutoIncrement' | 'Manual' | 'Overwrite' | 'OverwriteLatest'

export type GetDcqlQueryItemArgs = {
  itemId: string
}

export type HasDefinitionItemArgs = GetDcqlQueryItemArgs

export type FetchOptions = {
  showVersionHistory?: boolean
}

export type GetDcqlQueryItemsArgs = {
  filter?: FindDcqlQueryArgs
  opts?: FetchOptions
}

export type HasDcqlQueryItemsArgs = GetDcqlQueryItemsArgs

export type DeleteDcqlQueryItemArgs = {
  itemId: string
}

export type DeleteDcqlQueryItemsArgs = GetDcqlQueryItemsArgs

export type PersistDcqlQueryItem = Omit<NonPersistedDcqlQueryItem, 'version'> & {
  id?: string
  version?: string
}

export type PersistOptions = {
  versionControlMode?: VersionControlMode
  versionIncrementReleaseType?: ReleaseType
}

export type PersistDcqlQueryArgs = {
  definitionItem: PersistDcqlQueryItem
  opts?: PersistOptions
}

export type RequiredContext = IAgentContext<never>
