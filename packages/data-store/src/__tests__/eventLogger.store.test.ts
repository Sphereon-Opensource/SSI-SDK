import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { ActivityLoggingEvent, AuditLoggingEvent, CredentialType, PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { ActionType, InitiatorType, LoggingEventType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'
import { DataStoreEventLoggerMigrations } from '../migrations'
import { DataStoreEventLoggerEntities } from '../index'
import { EventLoggerStore } from '../eventLogger/EventLoggerStore'
import { GetActivityEventsArgs, GetAuditEventsArgs, NonPersistedActivityLoggingEvent, NonPersistedAuditLoggingEvent } from '../types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
    expect(savedAuditEvent.type).toEqual(LoggingEventType.AUDIT)
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

    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const storedActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(storedActivityEvent).toBeDefined()

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
      filter: [{ correlationId: 'unknown_id' }],
    }
    const result: Array<AuditLoggingEvent> = await eventLoggerStore.getAuditEvents(args)

    expect(result.length).toEqual(0)
  })

  it('should store activity event', async (): Promise<void> => {
    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const savedActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(savedActivityEvent).toBeDefined()
    expect(savedActivityEvent.type).toEqual(LoggingEventType.ACTIVITY)
    expect(savedActivityEvent.originalCredential).toEqual(activityEvent.originalCredential)
    expect(savedActivityEvent.credentialHash).toEqual(activityEvent.credentialHash)
    expect(savedActivityEvent.credentialType).toEqual(activityEvent.credentialType)
    expect(savedActivityEvent.data).toEqual(activityEvent.data)
  })

  it('should get all activity events', async (): Promise<void> => {
    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const activityEvent1: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(activityEvent1).toBeDefined()

    const activityEvent2: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(activityEvent2).toBeDefined()

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

    const storedAuditEvent: AuditLoggingEvent = await eventLoggerStore.storeAuditEvent({ event: auditEvent })
    expect(storedAuditEvent).toBeDefined()

    const result: Array<ActivityLoggingEvent> = await eventLoggerStore.getActivityEvents()
    expect(result.length).toEqual(2)
  })

  it('should get activity events by filter', async (): Promise<void> => {
    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const savedActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(savedActivityEvent).toBeDefined()

    const args: GetActivityEventsArgs = {
      filter: [{ credentialHash: savedActivityEvent.credentialHash }],
    }
    const result: Array<ActivityLoggingEvent> = await eventLoggerStore.getActivityEvents(args)

    expect(result.length).toEqual(1)
  })

  it('should return no audit events if filter does not match', async (): Promise<void> => {
    const activityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const savedActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: activityEvent })
    expect(savedActivityEvent).toBeDefined()

    const args: GetActivityEventsArgs = {
      filter: [{ credentialHash: 'unknown_hash' }],
    }
    const result: Array<ActivityLoggingEvent> = await eventLoggerStore.getActivityEvents(args)

    expect(result.length).toEqual(0)
  })

  it('should get all activity events for a parent credential', async (): Promise<void> => {
    const parentCredentialHash = 'df7037831edbde7f0f65f723ef5494d6'

    const parentActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const storedParentActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: parentActivityEvent })
    expect(storedParentActivityEvent).toBeDefined()

    const childActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const storedChildActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: childActivityEvent })
    expect(storedChildActivityEvent).toBeDefined()

    const otherActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: 'a8360b0b0b2eed8d185738536ff5b841',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential', // TODO
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

    const storedOtherActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: otherActivityEvent })
    expect(storedOtherActivityEvent).toBeDefined()

    const receiveActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Receive credential',
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

    const storedReceiveActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: receiveActivityEvent })
    expect(storedReceiveActivityEvent).toBeDefined()

    const args: GetActivityEventsArgs = {
      filter: [
        {
          credentialHash: parentCredentialHash,
        },
        {
          parentCredentialHash,
        },
      ],
    }

    const result: Array<ActivityLoggingEvent> = await eventLoggerStore.getActivityEvents(args)
    expect(result.length).toEqual(3)
  })

  it('should get all activity events for a parent credential with a certain action', async (): Promise<void> => {
    const parentCredentialHash = 'df7037831edbde7f0f65f723ef5494d6'

    const parentActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const storedParentActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: parentActivityEvent })
    expect(storedParentActivityEvent).toBeDefined()

    const childActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: '341a7897df58e472f9bf19b3b9abf7d5',
      parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential',
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

    const storedChildActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: childActivityEvent })
    expect(storedChildActivityEvent).toBeDefined()

    const otherActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: 'a8360b0b0b2eed8d185738536ff5b841',
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Share credential', // TODO
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

    const storedOtherActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: otherActivityEvent })
    expect(storedOtherActivityEvent).toBeDefined()

    const receiveActivityEvent: NonPersistedActivityLoggingEvent = {
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
      originalCredential: 'test_credential_string',
      credentialHash: parentCredentialHash,
      credentialType: CredentialType.SD_JWT,
      system: System.GENERAL,
      subSystemType: SubSystem.DID_PROVIDER,
      actionType: ActionType.EXECUTE,
      actionSubType: 'Receive credential',
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

    const storedReceiveActivityEvent: ActivityLoggingEvent = await eventLoggerStore.storeActivityEvent({ event: receiveActivityEvent })
    expect(storedReceiveActivityEvent).toBeDefined()

    const args: GetActivityEventsArgs = {
      filter: [
        {
          credentialHash: parentCredentialHash,
          actionSubType: 'Share credential',
        },
        {
          parentCredentialHash,
          actionSubType: 'Share credential',
        },
      ],
    }

    const result: Array<ActivityLoggingEvent> = await eventLoggerStore.getActivityEvents(args)
    expect(result.length).toEqual(2)
  })
})
