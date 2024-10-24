import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'

export type NonPersistedAuditLoggingEvent = Omit<AuditLoggingEvent, 'id' | 'type'>
export type NonPersistedActivityLoggingEvent = Omit<ActivityLoggingEvent, 'id' | 'type'>
