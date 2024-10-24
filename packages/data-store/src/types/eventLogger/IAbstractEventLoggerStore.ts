import { PartialActivityLoggingEvent, PartialAuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { NonPersistedActivityLoggingEvent, NonPersistedAuditLoggingEvent } from './eventLogger'

export type FindAuditLoggingEventArgs = Array<PartialAuditLoggingEvent>

export type FindActivityLoggingEventArgs = Array<PartialActivityLoggingEvent>

export type StoreAuditEventArgs = {
  event: NonPersistedAuditLoggingEvent
}

export type StoreActivityEventArgs = {
  event: NonPersistedActivityLoggingEvent
}

export type GetAuditEventsArgs = {
  filter?: FindAuditLoggingEventArgs
}

export type GetActivityEventsArgs = {
  filter?: FindActivityLoggingEventArgs
}
