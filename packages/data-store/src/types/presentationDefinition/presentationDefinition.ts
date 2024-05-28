import { IPresentationDefinition } from '@sphereon/pex'

export type PresentationDefinitionItem = {
  id: string
  definitionId: string
  tenantId?: string
  version: string
  purpose?: string
  definitionPayload: IPresentationDefinition
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
export type PresentationDefinitionItemFilter = Partial<Omit<PresentationDefinitionItem, 'definitionPayload'>>
