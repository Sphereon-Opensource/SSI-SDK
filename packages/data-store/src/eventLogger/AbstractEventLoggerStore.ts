import { GetAuditEventsArgs, StoreActivityEventArgs, StoreAuditEventArgs } from '../types'
import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'

export abstract class AbstractEventLoggerStore {
  abstract getAuditEvents(args: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  abstract getActivityEvents(args: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  abstract storeAuditEvent(args: StoreAuditEventArgs): Promise<AuditLoggingEvent>
  abstract storeActivityEvent(args: StoreActivityEventArgs): Promise<ActivityLoggingEvent>
}
