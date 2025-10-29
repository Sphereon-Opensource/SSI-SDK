import { NonPersistedDcqlQueryItem, DcqlQueryItem, DcqlQueryItemFilter } from './presentationDefinition'

export type FindDcqlQueryArgs = Array<DcqlQueryItemFilter>

export type GetDefinitionArgs = {
  itemId: string
}

export type HasDefinitionArgs = GetDefinitionArgs

export type GetDefinitionsArgs = {
  filter?: FindDcqlQueryArgs
}

export type HasDefinitionsArgs = GetDefinitionsArgs

export type AddDefinitionArgs = NonPersistedDcqlQueryItem

export type UpdateDefinitionArgs = DcqlQueryItem

export type DeleteDefinitionArgs = {
  itemId: string
}

export type DeleteDefinitionsArgs = GetDefinitionsArgs
