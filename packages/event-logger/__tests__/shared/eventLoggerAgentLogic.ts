import { ActionType, InitiatorType, LoggingEventType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { ActivityLoggingEvent, AuditLoggingEvent, CredentialType, PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { TAgent } from '@veramo/core'
import { GetActivityEventsArgs, GetAuditEventsArgs, IEventLogger, NonPersistedActivityLoggingEvent, NonPersistedAuditLoggingEvent } from '../../src'

type ConfiguredAgent = TAgent<IEventLogger>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  describe('Event Logger Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should store audit event', async (): Promise<void> => {
      const auditEvent: NonPersistedAuditLoggingEvent = {
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
        partyCorrelationId: 'did:example:123456789abcdefghi',
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      const result: AuditLoggingEvent = await agent.loggerLogAuditEvent({ event: auditEvent })

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.type).toEqual(LoggingEventType.AUDIT)
      expect(result?.timestamp).toBeDefined()
      expect(result?.level).toEqual(auditEvent.level)
      expect(result?.correlationId).toEqual(auditEvent.correlationId)
      expect(result?.system).toEqual(auditEvent.system)
      expect(result?.subSystemType).toEqual(auditEvent.subSystemType)
      expect(result?.actionType).toEqual(auditEvent.actionType)
      expect(result?.actionSubType).toEqual(auditEvent.actionSubType)
      expect(result?.initiatorType).toEqual(auditEvent.initiatorType)
      expect(result?.systemCorrelationIdType).toEqual(auditEvent.systemCorrelationIdType)
      expect(result?.systemCorrelationId).toEqual(auditEvent.systemCorrelationId)
      expect(result?.systemAlias).toEqual(auditEvent.systemAlias)
      expect(result?.partyCorrelationType).toEqual(auditEvent.partyCorrelationType)
      expect(result?.partyCorrelationId).toEqual(auditEvent.partyCorrelationId)
      expect(result?.partyAlias).toEqual(auditEvent.partyAlias)
      expect(result?.description).toEqual(auditEvent.description)
      expect(result?.data).toEqual(auditEvent.data)
      expect(result?.diagnosticData).toEqual(auditEvent.diagnosticData)
    })

    it('should get audit events without filter', async (): Promise<void> => {
      const auditEvent: NonPersistedAuditLoggingEvent = {
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
        partyCorrelationId: 'did:example:123456789abcdefghi',
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      await agent.loggerLogAuditEvent({ event: auditEvent })
      const result: Array<AuditLoggingEvent> = await agent.loggerGetAuditEvents()

      expect(result).toBeDefined()
      expect(result?.length).toBeGreaterThan(0)
    })

    it('should get audit events with filter', async (): Promise<void> => {
      const auditEvent: NonPersistedAuditLoggingEvent = {
        level: LogLevel.DEBUG,
        correlationId: 'a95bcf0d-9f75-46d1-9105-49518f8cb4ae',
        system: System.GENERAL,
        subSystemType: SubSystem.DID_PROVIDER,
        actionType: ActionType.CREATE,
        actionSubType: 'Key generation',
        initiatorType: InitiatorType.EXTERNAL,
        systemCorrelationIdType: SystemCorrelationIdType.DID,
        systemCorrelationId: 'did:example:123456789abcdefghi',
        systemAlias: 'test_alias',
        partyCorrelationType: PartyCorrelationType.DID,
        partyCorrelationId: 'did:example:123456789abcdefghi',
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      await agent.loggerLogAuditEvent({ event: auditEvent })
      const args: GetAuditEventsArgs = {
        filter: [{ correlationId: auditEvent.correlationId }],
      }
      const result: Array<AuditLoggingEvent> = await agent.loggerGetAuditEvents(args)

      expect(result).toBeDefined()
      expect(result?.length).toEqual(1)
    })

    it('should store activity event', async (): Promise<void> => {
      const activityEvent: NonPersistedActivityLoggingEvent = {
        level: LogLevel.DEBUG,
        correlationId: 'b40b8474-58a2-4b23-9fde-bd6ee1902cdb',
        system: System.GENERAL,
        subSystemType: SubSystem.OID4VCI_CLIENT,
        actionType: ActionType.CREATE,
        actionSubType: 'Key generation',
        initiatorType: InitiatorType.USER,
        systemCorrelationIdType: SystemCorrelationIdType.DID,
        systemCorrelationId: 'did:example:123456789abcdefghi',
        systemAlias: 'test_alias',
        partyCorrelationType: PartyCorrelationType.DID,
        partyCorrelationId: 'did:example:123456789abcdefghi',
        originalCredential:
          'eyJraWQiOiJFeEhrQk1XOWZtYmt2VjI2Nm1ScHVQMnNVWV9OX0VXSU4xbGFwVXpPOHJvIiwiYWxnIjoiRVMyNTYifQ .eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvZXhhbXBsZXMvdjIiXSwiaWQiOiJodHRwOi8vdW5pdmVyc2l0eS5leGFtcGxlL2NyZWRlbnRpYWxzLzM3MzIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRXhhbXBsZURlZ3JlZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiaHR0cHM6Ly91bml2ZXJzaXR5LmV4YW1wbGUvaXNzdWVycy81NjUwNDkiLCJ2YWxpZEZyb20iOiIyMDEwLTAxLTAxVDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmV4YW1wbGU6ZWJmZWIxZjcxMmViYzZmMWMyNzZlMTJlYzIxIiwiZGVncmVlIjp7InR5cGUiOiJFeGFtcGxlQmFjaGVsb3JEZWdyZWUiLCJuYW1lIjoiQmFjaGVsb3Igb2YgU2NpZW5jZSBhbmQgQXJ0cyJ9fX0 .vtw4cyIRP7YDVPpsLMmD_5ibDOjFrYr1fUJ7S74VoLHO_FIxueM1Wv6_zP8dEeR8jGw3t9vVLVl5CTf_i1KoVQ',
        credentialHash: '57575757',
        credentialType: CredentialType.JWT,
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      const result: ActivityLoggingEvent = await agent.loggerLogActivityEvent({ event: activityEvent })

      expect(result).toBeDefined()
      expect(result?.id).toBeDefined()
      expect(result?.type).toEqual(LoggingEventType.ACTIVITY)
      expect(result?.timestamp).toBeDefined()
      expect(result?.level).toEqual(activityEvent.level)
      expect(result?.correlationId).toEqual(activityEvent.correlationId)
      expect(result?.system).toEqual(activityEvent.system)
      expect(result?.subSystemType).toEqual(activityEvent.subSystemType)
      expect(result?.actionType).toEqual(activityEvent.actionType)
      expect(result?.actionSubType).toEqual(activityEvent.actionSubType)
      expect(result?.initiatorType).toEqual(activityEvent.initiatorType)
      expect(result?.systemCorrelationIdType).toEqual(activityEvent.systemCorrelationIdType)
      expect(result?.systemCorrelationId).toEqual(activityEvent.systemCorrelationId)
      expect(result?.systemAlias).toEqual(activityEvent.systemAlias)
      expect(result?.partyCorrelationType).toEqual(activityEvent.partyCorrelationType)
      expect(result?.partyCorrelationId).toEqual(activityEvent.partyCorrelationId)
      expect(result?.partyAlias).toEqual(activityEvent.partyAlias)
      expect(result?.description).toEqual(activityEvent.description)
      expect(result?.data).toEqual(activityEvent.data)
      expect(result?.diagnosticData).toEqual(activityEvent.diagnosticData)
    })

    it('should get activity events without filter', async (): Promise<void> => {
      const activityEvent: NonPersistedActivityLoggingEvent = {
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
        partyCorrelationId: 'did:example:123456789abcdefghi',
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      await agent.loggerLogAuditEvent({ event: activityEvent })
      const result: Array<AuditLoggingEvent> = await agent.loggerGetAuditEvents()

      expect(result).toBeDefined()
      expect(result?.length).toBeGreaterThan(0)
    })

    it('should get activity events with filter', async (): Promise<void> => {
      const activityEvent: NonPersistedActivityLoggingEvent = {
        level: LogLevel.DEBUG,
        correlationId: '88c4d6c0-5e2a-419d-b67b-e85f65f009bc',
        system: System.GENERAL,
        subSystemType: SubSystem.DID_PROVIDER,
        actionType: ActionType.CREATE,
        actionSubType: 'Key generation',
        initiatorType: InitiatorType.EXTERNAL,
        systemCorrelationIdType: SystemCorrelationIdType.DID,
        systemCorrelationId: 'did:example:123456789abcdefghi',
        systemAlias: 'test_alias',
        partyCorrelationType: PartyCorrelationType.DID,
        partyCorrelationId: 'did:example:123456789abcdefghi',
        partyAlias: 'test_alias',
        description: 'test_description',
        data: 'test_data_string',
        diagnosticData: { data: 'test_data_string' },
      }

      await agent.loggerLogActivityEvent({ event: activityEvent })
      const args: GetActivityEventsArgs = {
        filter: [{ correlationId: activityEvent.correlationId }],
      }
      const result: Array<ActivityLoggingEvent> = await agent.loggerGetActivityEvents(args)

      expect(result).toBeDefined()
      expect(result?.length).toEqual(1)
    })
  })
}
