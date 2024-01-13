import { PartialAuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { NonPersistedAuditLoggingEvent } from './eventLogger'

export type FindAuditLoggingEventArgs = Array<PartialAuditLoggingEvent>

export type StoreAuditEventArgs = {
  event: NonPersistedAuditLoggingEvent
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}
