import { NonPersistedPresentationDefinitionItem, PresentationDefinitionItem, PresentationDefinitionItemFilter } from './presentationDefinition'

export type FindDefinitionArgs = Array<PresentationDefinitionItemFilter>

export type GetDefinitionArgs = {
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
