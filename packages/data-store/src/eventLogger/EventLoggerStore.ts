import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { LoggingEventType, OrPromise } from '@sphereon/ssi-types'
import Debug, { Debugger } from 'debug'
import { DataSource } from 'typeorm'
import { AbstractEventLoggerStore } from './AbstractEventLoggerStore'
import {
  activityEventEntityFrom,
  AuditEventEntity,
  auditEventEntityFrom
} from '../entities/eventLogger/AuditEventEntity'
import { activityEventFrom, auditEventFrom } from '../utils/eventLogger/MappingUtils'
import {
  GetActivityEventsArgs,
  GetAuditEventsArgs,
  StoreActivityEventArgs,
  StoreAuditEventArgs
} from '../types'

const debug: Debugger = Debug('sphereon:ssi-sdk:event-store')

export class EventLoggerStore extends AbstractEventLoggerStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getAuditEvents = async (args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>> => {
    const { filter = [] } = args ?? {}

    const auditEventsFilter = filter.map((item) => ({ ...item, type: LoggingEventType.AUDIT }))
    if (auditEventsFilter.length === 0) {
      auditEventsFilter.push({ type: LoggingEventType.AUDIT })
    }

    const connection = await this.dbConnection
    debug('Getting audit events', args)
    const result = await connection.getRepository(AuditEventEntity).find({
      where: auditEventsFilter
    })

    return result.map((event: AuditEventEntity) => auditEventFrom(event))
  }

  storeAuditEvent = async (args: StoreAuditEventArgs): Promise<AuditLoggingEvent> => {
    const { event } = args

    const auditEventEntity = auditEventEntityFrom(event)
    const connection = await this.dbConnection
    debug('Storing audit event', auditEventEntity)
    const createdResult = await connection.getRepository(AuditEventEntity).save(auditEventEntity)

    return auditEventFrom(createdResult)
  }

  getActivityEvents = async (args?: GetActivityEventsArgs): Promise<Array<ActivityLoggingEvent>> => {
    const { filter = [] } = args ?? {}

    const activityEventsFilter = filter.map((item) => ({ ...item, type: LoggingEventType.ACTIVITY }))
    if (activityEventsFilter.length === 0) {
      activityEventsFilter.push({ type: LoggingEventType.ACTIVITY })
    }

    const connection = await this.dbConnection
    debug('Getting activity events', args)
    const result = await connection.getRepository(AuditEventEntity).find({
      where: activityEventsFilter
    })

    return result.map((event: AuditEventEntity) => activityEventFrom(event))
  }

  storeActivityEvent = async (args: StoreActivityEventArgs): Promise<ActivityLoggingEvent> => {
    const { event } = args

    const activityEventEntity = activityEventEntityFrom(event)
    const connection = await this.dbConnection
    debug('Storing activity event', activityEventEntity)
    const createdResult = await connection.getRepository(AuditEventEntity).save(activityEventEntity)

    return activityEventFrom(createdResult)
  }
}
