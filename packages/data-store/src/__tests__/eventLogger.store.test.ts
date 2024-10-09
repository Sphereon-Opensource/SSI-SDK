import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { ActionType, InitiatorType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { DataStoreEventLoggerMigrations } from '../migrations'
import { DataStoreEventLoggerEntities } from '../index'
import { AuditLoggingEvent, PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { EventLoggerStore } from '../eventLogger/EventLoggerStore'
import { GetAuditEventsArgs, NonPersistedAuditLoggingEvent } from '../types'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource
  let eventLoggerStore: EventLoggerStore

  beforeEach(async (): Promise<void> => {
    DataSources.singleInstance().defaultDbType = 'sqlite'
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreEventLoggerMigrations,
      synchronize: false,
      entities: DataStoreEventLoggerEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    eventLoggerStore = new EventLoggerStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should store audit event', async (): Promise<void> => {
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

    const savedAuditEvent: AuditLoggingEvent = await eventLoggerStore.storeAuditEvent({ event: auditEvent })
    expect(savedAuditEvent).toBeDefined()
  })

  it('should get all audit events', async (): Promise<void> => {
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

    const auditEvent1: AuditLoggingEvent = await eventLoggerStore.storeAuditEvent({ event: auditEvent })
    expect(auditEvent1).toBeDefined()

    const auditEvent2: AuditLoggingEvent = await eventLoggerStore.storeAuditEvent({ event: auditEvent })
    expect(auditEvent2).toBeDefined()

    const result: Array<AuditLoggingEvent> = await eventLoggerStore.getAuditEvents()
    expect(result.length).toEqual(2)
  })

  it('should get audit events by filter', async (): Promise<void> => {
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

    const savedAuditEvent: AuditLoggingEvent = await eventLoggerStore.storeAuditEvent({ event: auditEvent })
    expect(savedAuditEvent).toBeDefined()

    const args: GetAuditEventsArgs = {
      filter: [{ correlationId: auditEvent.correlationId }],
    }
    const result: Array<AuditLoggingEvent> = await eventLoggerStore.getAuditEvents(args)

    expect(result.length).toEqual(1)
  })

  it('should return no audit events if filter does not match', async (): Promise<void> => {
    const args: GetAuditEventsArgs = {
      filter: [{ correlationId: 'unknown_id' }],
    }
    const result: Array<AuditLoggingEvent> = await eventLoggerStore.getAuditEvents(args)

    expect(result.length).toEqual(0)
  })
})
