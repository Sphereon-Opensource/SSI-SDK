import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FindDefinitionArgs, NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'
import { IPresentationDefinition } from '@sphereon/pex'

export interface IPDManager extends IPluginMethodMap {
  pdmGetDefinitionItem(args: GetDefinitionItemArgs): Promise<PresentationDefinitionItem>
  pdmGetDefinitionsItem(args: GetDefinitionsItemArgs): Promise<Array<PresentationDefinitionItem>>
  pdmAddDefinitionItem(args: AddDefinitionItemArgs): Promise<PresentationDefinitionItem>
  pdmUpdateDefinitionItem(args: UpdateDefinitionItemArgs): Promise<PresentationDefinitionItem>
  pdmDeleteDefinitionItem(args: DeleteDefinitionItemArgs): Promise<boolean>

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
  definition: IPresentationDefinition
  tenantId?: string
  version?: string
  versionControlMode?: VersionControlMode
}

export type RequiredContext = IAgentContext<never>
