import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  FindDefinitionArgs,
  NonPersistedPresentationDefinitionItem,
  PersistablePresentationDefinitionItem,
  PresentationDefinitionItem,
} from '@sphereon/ssi-sdk.data-store'

export interface IPDManager extends IPluginMethodMap {
  /**
   * Get a single presentation definition records by primary key
   * @param args
   */
  pdmGetDefinition(args: GetDefinitionItemArgs): Promise<PresentationDefinitionItem>

  /**
   * Find one or more presentation definition records by filters
   * @param args
   */
  pdmGetDefinitions(args: GetDefinitionsItemArgs): Promise<Array<PresentationDefinitionItem>>

  /**
   * Add a presentation definition record
   * @param args
   */
  pdmAddDefinition(args: AddDefinitionItemArgs): Promise<PresentationDefinitionItem>

  /**
   * Update an existing presentation definition record
   * @param args
   */
  pdmUpdateDefinition(args: UpdateDefinitionItemArgs): Promise<PresentationDefinitionItem>

  /**
   * Delete a single presentation definition records by primary key
   * @param args
   */
  pdmDeleteDefinition(args: DeleteDefinitionItemArgs): Promise<boolean>

  /**
   * Persist a presentation definition.
   * It has version control logic which will add or update presentation definition records and has settings for automatic version numbering.
   * @param args
   */
  pdmPersistDefinition(args: PersistDefinitionArgs): Promise<PresentationDefinitionItem>
}

export type VersionControlMode = 'AutoIncrementMajor' | 'AutoIncrementMinor' | 'Manual' | 'Overwrite' | 'OverwriteLatest'

export type GetDefinitionItemArgs = {
  itemId: string
}

export type GetDefinitionsItemArgs = {
  filter?: FindDefinitionArgs
}

export type AddDefinitionItemArgs = NonPersistedPresentationDefinitionItem

export type UpdateDefinitionItemArgs = {
  definitionItem: PresentationDefinitionItem
}

export type DeleteDefinitionItemArgs = {
  itemId: string
}

export type PersistDefinitionArgs = {
  definitionItem: PersistablePresentationDefinitionItem
  versionControlMode?: VersionControlMode
}

export type RequiredContext = IAgentContext<never>
