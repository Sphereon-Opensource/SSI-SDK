import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem, PresentationDefinitionItemFilter } from './pd'

export type FindDefinitionArgs = Array<PresentationDefinitionItemFilter>

export type GetGetDefinitionArgs = {
  itemId: string
}

export type GetDefinitionsArgs = {
  filter?: FindDefinitionArgs
}

export type AddDefinitionArgs = NonPersistedPresentationDefinitionItem

export type UpdateDefinitionArgs = PresentationDefinitionItem

export type DeleteDefinitionArgs = {
  itemId: string
}
