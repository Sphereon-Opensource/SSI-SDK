import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { CredentialType, PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { ActionType, InitiatorType, LoggingEventType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuditEventEntity } from '../entities/eventLogger/AuditEventEntity'
import { DataStoreEventLoggerEntities } from '../index'
import { DataStoreEventLoggerMigrations } from '../migrations'
import { NonPersistedActivityLoggingEvent, NonPersistedAuditLoggingEvent } from '@sphereon/ssi-sdk.data-store-types'
import { activityEventEntityFrom, auditEventEntityFrom } from '../utils/eventLogger/MappingUtils'

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
    expect(fromDb?.type).toEqual(LoggingEventType.AUDIT)
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

  it('should save activity event to database', async (): Promise<void> => {
    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      parentCredentialHash: 'df7037831edbde7f0f65f723ef5494d6',
      credentialType: CredentialType.SD_JWT,
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

    const activityEventEntity: AuditEventEntity = activityEventEntityFrom(activityEvent)
    const fromDb: AuditEventEntity = await dbConnection.getRepository(AuditEventEntity).save(activityEventEntity)

    expect(fromDb).toBeDefined()
    expect(fromDb?.id).not.toBeNull()
    expect(fromDb?.type).toEqual(LoggingEventType.ACTIVITY)
    expect(fromDb?.timestamp).toEqual(activityEvent.timestamp)
    expect(fromDb?.level).toEqual(activityEvent.level)
    expect(fromDb?.correlationId).toEqual(activityEvent.correlationId)
    expect(fromDb?.system).toEqual(activityEvent.system)
    expect(fromDb?.subSystemType).toEqual(activityEvent.subSystemType)
    expect(fromDb?.actionType).toEqual(activityEvent.actionType)
    expect(fromDb?.actionSubType).toEqual(activityEvent.actionSubType)
    expect(fromDb?.initiatorType).toEqual(activityEvent.initiatorType)
    expect(fromDb?.systemCorrelationIdType).toEqual(activityEvent.systemCorrelationIdType)
    expect(fromDb?.systemCorrelationId).toEqual(activityEvent.systemCorrelationId)
    expect(fromDb?.systemAlias).toEqual(activityEvent.systemAlias)
    expect(fromDb?.partyCorrelationType).toEqual(activityEvent.partyCorrelationType)
    expect(fromDb?.partyCorrelationId).toEqual(activityEvent.partyCorrelationId)
    expect(fromDb?.partyAlias).toEqual(activityEvent.partyAlias)
    expect(fromDb?.description).toEqual(activityEvent.description)
    expect(fromDb?.data).toEqual(JSON.stringify(activityEvent.data))
    expect(fromDb?.diagnosticData).toEqual(JSON.stringify(activityEvent.diagnosticData))
    expect(fromDb?.credentialHash).toEqual(activityEvent.credentialHash)
    expect(fromDb?.parentCredentialHash).toEqual(activityEvent.parentCredentialHash)
    expect(fromDb?.credentialType).toEqual(activityEvent.credentialType)
  })
})
