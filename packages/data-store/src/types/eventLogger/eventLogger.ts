import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'

export type NonPersistedAuditLoggingEvent = Omit<AuditLoggingEvent, 'id'>
export type NonPersistedActivityLoggingEvent = Omit<ActivityLoggingEvent, 'id'>
