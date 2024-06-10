import { IPresentationDefinition } from '@sphereon/pex'

export type PresentationDefinitionItem = {
  id: string
  definitionId: string
  tenantId?: string
  version: string
  name?: string
  purpose?: string
  definitionPayload: IPresentationDefinition
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
export type PresentationDefinitionItemFilter = Partial<Omit<PresentationDefinitionItem, 'definitionPayload'>> // TODO add logic to linearize & hash definitionPayload into a separate column so we can filter on it?
