import { AuditLoggingEvent } from '@sphereon/ssi-sdk.core'

export type NonPersistedAuditLoggingEvent = Omit<AuditLoggingEvent, 'id'>
