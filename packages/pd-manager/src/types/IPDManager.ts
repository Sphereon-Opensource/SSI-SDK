import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FindPDArgs, NonPersistedPresentationDefinitionItem, PresentationDefinitionItem } from '@sphereon/ssi-sdk.data-store'

export interface IPDManager extends IPluginMethodMap {
  pdmGetDefinition(args: GetPDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmGetDefinitions(args: GetPDsArgs, context: RequiredContext): Promise<Array<PresentationDefinitionItem>>
  pdmAddDefinition(args: AddPDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmUpdateDefinition(args: UpdatePDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
  pdmDeleteDefinition(args: DeletePDArgs, context: RequiredContext): Promise<boolean>
}

export type GetPDArgs = {
  itemId: string
}

export type GetPDsArgs = {
  filter?: FindPDArgs
}

export type AddPDArgs = NonPersistedPresentationDefinitionItem

export type UpdatePDArgs = {
  pd: PresentationDefinitionItem
}

export type DeletePDArgs = {
  itemId: string
}

export type RequiredContext = IAgentContext<never>
