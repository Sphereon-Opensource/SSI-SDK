import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { ActionType, InitiatorType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { DataStoreEventLoggerEntities } from '../index'
import { DataStoreEventLoggerMigrations } from '../migrations/generic'
import { auditEventEntityFrom, AuditEventEntity } from '../entities/eventLogger/AuditEventEntity'
import { NonPersistedAuditLoggingEvent } from '../types'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreEventLoggerMigrations,
      synchronize: false,
      entities: [...DataStoreEventLoggerEntities],
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should save audit event to database', async (): Promise<void> => {
    const auditEvent: NonPersistedAuditLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.CREATE,
      actionSubType: 'Key generation',
      initiatorType: InitiatorType.EXTERNAL,
      systemCorrelationIdType: SystemCorrelationIdType.DID,
      systemCorrelationId: 'did:example:123456789abcdefghi',
      systemAlias: 'test_alias',
      partyCorrelationType: PartyCorrelationType.DID,
      partyCorrelationId: '75cfd84a-0f3b-4fb1-97a3-a1506c7ab850',
      partyAlias: 'test_alias',
      description: 'test_description',
      data: 'test_data_string',
      diagnosticData: { data: 'test_data_string' },
    }

    const auditEventEntity: AuditEventEntity = auditEventEntityFrom(auditEvent)
    const fromDb: AuditEventEntity = await dbConnection.getRepository(AuditEventEntity).save(auditEventEntity)

    expect(fromDb).toBeDefined()
    expect(fromDb?.id).not.toBeNull()
    expect(fromDb?.timestamp).toEqual(auditEvent.timestamp)
    expect(fromDb?.level).toEqual(auditEvent.level)
    expect(fromDb?.correlationId).toEqual(auditEvent.correlationId)
    expect(fromDb?.system).toEqual(auditEvent.system)
    expect(fromDb?.subSystemType).toEqual(auditEvent.subSystemType)
    expect(fromDb?.actionType).toEqual(auditEvent.actionType)
    expect(fromDb?.actionSubType).toEqual(auditEvent.actionSubType)
    expect(fromDb?.initiatorType).toEqual(auditEvent.initiatorType)
    expect(fromDb?.systemCorrelationIdType).toEqual(auditEvent.systemCorrelationIdType)
    expect(fromDb?.systemCorrelationId).toEqual(auditEvent.systemCorrelationId)
    expect(fromDb?.systemAlias).toEqual(auditEvent.systemAlias)
    expect(fromDb?.partyCorrelationType).toEqual(auditEvent.partyCorrelationType)
    expect(fromDb?.partyCorrelationId).toEqual(auditEvent.partyCorrelationId)
    expect(fromDb?.partyAlias).toEqual(auditEvent.partyAlias)
    expect(fromDb?.description).toEqual(auditEvent.description)
    expect(fromDb?.data).toEqual(JSON.stringify(auditEvent.data))
    expect(fromDb?.diagnosticData).toEqual(JSON.stringify(auditEvent.diagnosticData))
  })
})
