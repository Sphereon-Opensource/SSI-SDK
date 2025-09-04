import { DcqlQuery } from 'dcql'

export interface DcqlQueryPayload {
  definitionId: string

  dcqlQuery: DcqlQuery
}
