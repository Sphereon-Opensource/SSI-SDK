import { IPresentationDefinition } from '@sphereon/pex'
import { DcqlQueryPayload } from '@sphereon/ssi-types'

export type PresentationDefinitionItem = {
  id: string
  definitionId: string
  tenantId?: string
  version: string
  name?: string
  purpose?: string
  definitionPayload?: IPresentationDefinition
  dcqlPayload?: DcqlQueryPayload
  createdAt: Date
  lastUpdatedAt: Date
}

export type NonPersistedPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>
export type PresentationDefinitionItemFilter = Partial<Omit<PresentationDefinitionItem, 'definitionPayload' | 'dcqlPayload'>>
