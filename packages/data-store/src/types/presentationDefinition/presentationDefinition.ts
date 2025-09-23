import { DcqlQuery } from 'dcql'

export type DcqlQueryItem = {
  id: string
  queryId: string
  tenantId?: string
  version: string
  name?: string
  purpose?: string
  query: DcqlQuery
  createdAt: Date
  lastUpdatedAt: Date
}

export type ImportDcqlQueryItem = Omit<DcqlQueryItem, 'id' | 'tenantId' | 'version' | 'createdAt' | 'lastUpdatedAt'>
export type NonPersistedDcqlQueryItem = Omit<DcqlQueryItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialDcqlQueryItem = Partial<DcqlQueryItem>
export type DcqlQueryItemFilter = Partial<Omit<DcqlQueryItem, 'query'>>
