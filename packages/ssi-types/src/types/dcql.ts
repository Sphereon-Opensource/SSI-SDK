import { DcqlQuery } from 'dcql'

export interface DcqlQueryPayload {
  definitionId: string
  dcqlQuery: DcqlQuery
}

export interface DcqlQueryPayloadREST {
  definitionId: string
  dcqlQuery: string // TODO before PR: We must make sure we manually (de)serialize over network requests
}
