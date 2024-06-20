import { ActionType, InitiatorType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { TAgent } from '@veramo/core'
import { AuditLoggingEvent, PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { GetAuditEventsArgs, IEventLogger, NonPersistedAuditLoggingEvent } from '../../src'

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
        correlationId: 'filter_test_correlation_id',
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
  })
}
