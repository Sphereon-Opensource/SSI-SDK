import Debug, { Debugger } from 'debug'
import { DataSource } from 'typeorm'
import { AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { OrPromise } from '@sphereon/ssi-types'
import { AbstractEventLoggerStore } from './AbstractEventLoggerStore'
import { AuditEventEntity, auditEventEntityFrom } from '../entities/eventLogger/AuditEventEntity'
import { GetAuditEventsArgs, StoreAuditEventArgs } from '../types'

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
    const result: Array<AuditEventEntity> = await connection.getRepository(AuditEventEntity).find({
      ...(args?.filter && { where: args?.filter }),
    })

    return result.map((event: AuditEventEntity) => this.auditEventFrom(event))
  }

  storeAuditEvent = async (args: StoreAuditEventArgs): Promise<AuditLoggingEvent> => {
    const { event } = args

    const auditEventEntity: AuditEventEntity = auditEventEntityFrom(event)
    const connection: DataSource = await this.dbConnection
    debug('Storing audit event', auditEventEntity)
    const createdResult: AuditEventEntity = await connection.getRepository(AuditEventEntity).save(auditEventEntity)

    return this.auditEventFrom(createdResult)
  }

  private auditEventFrom = (event: AuditEventEntity): AuditLoggingEvent => {
    return {
      id: event.id,
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
