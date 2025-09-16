import { IPresentationDefinition } from '@sphereon/pex'
import { DcqlQuery } from 'dcql'

export type PresentationDefinitionItem = {
  id: string
  definitionId: string
  tenantId?: string
  version: string
  name?: string
  purpose?: string
  definitionPayload?: IPresentationDefinition
  dcqlQuery?: DcqlQuery
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
export type PresentationDefinitionItemFilter = Partial<Omit<PresentationDefinitionItem, 'definitionPayload' | 'dcqlQuery'>>

export type DcqlQueryImportItem = {
  queryId: string
  name?: string
  purpose?: string
  dcqlQuery: DcqlQuery
}
