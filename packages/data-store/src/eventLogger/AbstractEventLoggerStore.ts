import { GetAuditEventsArgs, StoreAuditEventArgs } from '../types'
import { AuditLoggingEvent } from '@sphereon/ssi-sdk.core'

export abstract class AbstractEventLoggerStore {
  abstract getAuditEvents(args: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>>
  abstract storeAuditEvent(args: StoreAuditEventArgs): Promise<AuditLoggingEvent>
}
