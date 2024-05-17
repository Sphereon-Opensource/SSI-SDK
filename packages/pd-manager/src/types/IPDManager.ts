import {IAgentContext, IPluginMethodMap} from '@veramo/core'
import {
    FindPartyArgs as FindContactArgs,
    NonPresentationDefinitionItem,
    PresentationDefinitionItem
} from "@sphereon/ssi-sdk.data-store";

export interface IPDManager extends IPluginMethodMap {
    pdmGetDefinition(args: GetPDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
    pdmGetDefinitions(args: GetPDsArgs, context: RequiredContext): Promise<Array<PresentationDefinitionItem>>
    pdmAddDefinition(args: AddPDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
    pdmUpdateDefinition(args: UpdatePDArgs, context: RequiredContext): Promise<PresentationDefinitionItem>
    pdmRemoveDefinition(args: RemovePDArgs, context: RequiredContext): Promise<boolean>
}

export type GetPDArgs = {
    pdId: string
}

export type GetPDsArgs = {
    filter?: FindPDArgs
}


export type AddPDArgs = NonPresentationDefinitionItem

export type UpdatePDArgs = {
    pd: PresentationDefinitionItem
}

export type RemovePDArgs = {
    pdId: string
}

export type RequiredContext = IAgentContext<never>