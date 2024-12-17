import { IPresentationDefinition } from '@sphereon/pex'
import { DcqlQuery } from '@sphereon/ssi-types'

export type PresentationDefinitionItem = {
  id: string
  definitionId: string
  tenantId?: string
  version: string
  name?: string
  purpose?: string
  definitionPayload: IPresentationDefinition
  dcqlPayload?: DcqlQuery
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
export type PresentationDefinitionItemFilter = Partial<Omit<PresentationDefinitionItem, 'definitionPayload' | 'dcqlPayload'>> // TODO add logic to linearize & hash definitionPayload into a separate column so we can filter on it?
