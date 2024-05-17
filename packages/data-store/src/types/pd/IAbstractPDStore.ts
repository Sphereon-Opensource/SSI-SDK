import {NonPresentationDefinitionItem, PartialPresentationDefinitionItem, PresentationDefinitionItem} from "./pd";


export type FindPDArgs = Array<PartialPresentationDefinitionItem>

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
