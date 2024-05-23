import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem, PresentationDefinitionItemFilter } from './pd'

export type FindPDArgs = Array<PresentationDefinitionItemFilter>

export type GetPDArgs = {
  itemId: string
}

export type GetPDsArgs = {
  filter?: FindPDArgs
}

export type AddPDArgs = NonPersistedPresentationDefinitionItem

export type UpdatePDArgs = PresentationDefinitionItem

export type DeletePDArgs = {
  itemId: string
}
