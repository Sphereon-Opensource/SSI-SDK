import { NonPersistedPresentationDefinitionItem, PartialPresentationDefinitionItem, PresentationDefinitionItem } from './pd'

export type FindPDArgs = Array<PartialPresentationDefinitionItem>

export type GetPDArgs = {
  itemId: string
}

export type GetPDsArgs = {
  filter?: FindPDArgs
}

export type AddPDArgs = NonPersistedPresentationDefinitionItem

export type UpdatePDArgs = PresentationDefinitionItem

export type DeletePDArgs = {
  id: string
}
