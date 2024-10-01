import Debug, { Debugger } from 'debug'
import { DataSource } from 'typeorm'
import { ActivityLoggingEvent, AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { OrPromise } from '@sphereon/ssi-types'
import { AbstractEventLoggerStore } from './AbstractEventLoggerStore'
import { activityEventEntityFrom, AuditEventEntity, auditEventEntityFrom } from '../entities/eventLogger/AuditEventEntity'
import { GetActivityEventsArgs, GetAuditEventsArgs, StoreActivityEventArgs, StoreAuditEventArgs } from '../types'
import { LoggingEventType } from '@sphereon/ssi-types/dist'

const debug: Debugger = Debug('sphereon:ssi-sdk:event-store')

export class EventLoggerStore extends AbstractEventLoggerStore {
  private readonly dbConnection: OrPromise<DataSource>

  constructor(dbConnection: OrPromise<DataSource>) {
    super()
    this.dbConnection = dbConnection
  }

  getAuditEvents = async (args?: GetAuditEventsArgs): Promise<Array<AuditLoggingEvent>> => {
    const connection: DataSource = await this.dbConnection // TODO apply everywhere
    debug('Getting audit events', args)
    const where: any = {}
    if (args?.filter) {
      args.filter.forEach((filterCondition) => {
        Object.assign(where, filterCondition)
      })
    }
    const result: Array<AuditEventEntity> = await connection.getRepository(AuditEventEntity).find({
      where,
    })

    return result.map((event: AuditEventEntity) => this.auditEventFrom(event))
  }

  getActivityEvents = async (args?: GetActivityEventsArgs): Promise<Array<ActivityLoggingEvent>> => {
    const connection: DataSource = await this.dbConnection
    debug('Getting activity events', args)
    const where: any = {}
    if (args?.filter) {
      args.filter.forEach((filterCondition) => {
        Object.assign(where, filterCondition)
      })
    }
    const result: Array<AuditEventEntity> = await connection.getRepository(AuditEventEntity).find({
      where,
    })

    return result.map((event: AuditEventEntity) => this.activityEventFrom(event))
  }

  storeAuditEvent = async (args: StoreAuditEventArgs): Promise<AuditLoggingEvent> => {
    const { event } = args

    const auditEventEntity: AuditEventEntity = auditEventEntityFrom(event)
    const connection: DataSource = await this.dbConnection
    debug('Storing audit event', auditEventEntity)
    const createdResult: AuditEventEntity = await connection.getRepository(AuditEventEntity).save(auditEventEntity)

    return this.auditEventFrom(createdResult)
  }

  storeActivityEvent = async (args: StoreActivityEventArgs): Promise<ActivityLoggingEvent> => {
    const { event } = args

    const activityEventEntity: AuditEventEntity = activityEventEntityFrom(event)
    const connection: DataSource = await this.dbConnection
    debug('Storing activity event', activityEventEntity)
    const createdResult: AuditEventEntity = await connection.getRepository(AuditEventEntity).save(activityEventEntity)

    return this.activityEventFrom(createdResult)
  }

  private auditEventFrom = (event: AuditEventEntity): AuditLoggingEvent => {
    return {
      id: event.id,
      type: LoggingEventType.AUDIT,
      description: event.description,
      timestamp: event.timestamp,
      level: event.level,
      correlationId: event.correlationId,
      actionType: event.actionType,
      actionSubType: event.actionSubType,
      initiatorType: event.initiatorType,
      partyAlias: event.partyAlias,
      partyCorrelationId: event.partyCorrelationId,
      partyCorrelationType: event.partyCorrelationType,
      subSystemType: event.subSystemType,
      system: event.system,
      systemAlias: event.systemAlias,
      systemCorrelationId: event.systemCorrelationId,
      systemCorrelationIdType: event.systemCorrelationIdType,
      ...(event.data && { data: JSON.parse(event.data) }),
      ...(event.diagnosticData && { diagnosticData: JSON.parse(event.diagnosticData) }),
    }
  }

  private activityEventFrom = (event: AuditEventEntity): ActivityLoggingEvent => {
    return {
      id: event.id,
      type: LoggingEventType.ACTIVITY,
      credentialType: event.credentialType,
      sharePurpose: event.sharePurpose,
      description: event.description,
      timestamp: event.timestamp,
      level: event.level,
      correlationId: event.correlationId,
      actionType: event.actionType,
      actionSubType: event.actionSubType,
      initiatorType: event.initiatorType,
      partyAlias: event.partyAlias,
      partyCorrelationId: event.partyCorrelationId,
      partyCorrelationType: event.partyCorrelationType,
      subSystemType: event.subSystemType,
      system: event.system,
      systemAlias: event.systemAlias,
      systemCorrelationId: event.systemCorrelationId,
      systemCorrelationIdType: event.systemCorrelationIdType,
      ...(event.data && { data: JSON.parse(event.data) }),
      ...(event.diagnosticData && { diagnosticData: JSON.parse(event.diagnosticData) }),
    }
  }
}
