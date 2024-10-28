import Debug, { Debugger } from 'debug'
import { DataSource } from 'typeorm'
import { AuditLoggingEvent } from '@sphereon/ssi-sdk.core'
import { OrPromise } from '@sphereon/ssi-types'
import { AbstractEventLoggerStore } from './AbstractEventLoggerStore'
import { AuditEventEntity, auditEventEntityFrom } from '../entities/eventLogger/AuditEventEntity'
import { auditEventFrom } from '../utils/eventLogger/MappingUtils'
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

    return result.map((event: AuditEventEntity) => auditEventFrom(event))
  }

  storeAuditEvent = async (args: StoreAuditEventArgs): Promise<AuditLoggingEvent> => {
    const { event } = args

    const auditEventEntity: AuditEventEntity = auditEventEntityFrom(event)
    const connection: DataSource = await this.dbConnection
    debug('Storing audit event', auditEventEntity)
    const createdResult: AuditEventEntity = await connection.getRepository(AuditEventEntity).save(auditEventEntity)

    return auditEventFrom(createdResult)
  }
}
