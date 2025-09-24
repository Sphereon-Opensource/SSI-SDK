import type { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import type { GetActivityEventsArgs, GetAuditEventsArgs, StoreActivityEventArgs, StoreAuditEventArgs } from '../types'

export abstract class AbstractEventLoggerStore {
  abstract getAuditEvents(args: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  abstract getActivityEvents(args: GetActivityEventsArgs): Promise<Array<ActivityLoggingEvent>>
  abstract storeAuditEvent(args: StoreAuditEventArgs): Promise<AuditLoggingEvent>
  abstract storeActivityEvent(args: StoreActivityEventArgs): Promise<ActivityLoggingEvent>
}
