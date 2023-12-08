import {
  AuditLoggingEvent,
  PartialAuditLoggingEvent
} from '@sphereon/ssi-sdk.core'

export type FindAuditLoggingEventArgs = Array<PartialAuditLoggingEvent>

export type StoreAuditEventArgs = {
  event: Omit<AuditLoggingEvent, 'id'>
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}
