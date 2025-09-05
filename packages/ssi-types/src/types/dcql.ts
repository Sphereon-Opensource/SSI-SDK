import { DcqlQuery } from 'dcql'

export interface DcqlQueryPayload {
  queryId: string
  dcqlQuery: DcqlQuery
}

export interface DcqlQueryPayloadREST {
  queryId: string
  dcqlQuery: string // TODO before PR: We must make sure we manually (de)serialize over network requests
}
