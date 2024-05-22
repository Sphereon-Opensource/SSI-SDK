import { IPresentationDefinition } from '@sphereon/pex'

export type PresentationDefinitionItem = {
  id: string
  tenantId?: string
  pdId: string
  version: string
  purpose?: string
  definitionPayload: IPresentationDefinition
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
