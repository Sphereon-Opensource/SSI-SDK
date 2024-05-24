import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FindDefinitionArgs, NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

export interface IPDManager extends IPluginMethodMap {
  pdmGetDefinition(args: GetDefinitionArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmGetDefinitions(args: GetDefinitionsArgs, context: RequiredContext): Promise<Array<PresentationDefinitionItem>>
  pdmAddDefinition(args: AddDefinitionArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmUpdateDefinition(args: UpdateDefinitionArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmDeleteDefinition(args: DeleteDefinitionArgs, context: RequiredContext): Promise<boolean>
}

export type GetDefinitionArgs = {
  itemId: string
}

export type GetDefinitionsArgs = {
  filter?: FindDefinitionArgs
}

export type AddDefinitionArgs = NonPersistedPresentationDefinitionItem

export type UpdateDefinitionArgs = {
  definitionItem: PresentationDefinitionItem
}

export type DeleteDefinitionArgs = {
  itemId: string
}

export type RequiredContext = IAgentContext<never>
