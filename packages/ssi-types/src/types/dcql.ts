import { DcqlQuery } from 'dcql'

export interface DcqlQueryPayload {
  queryId: string
  name?: string
  defaultPurpose?: string
  dcqlQuery: DcqlQuery
}
