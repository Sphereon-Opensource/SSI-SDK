import { IAgentContext } from '@veramo/core'

export enum LogLevel {
  TRACE = 0,
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

export enum System {
  GENERAL = 'general',
  KMS = 'kms',
  IDENTITY = 'identity',
  OID4VCI = 'oid4vci',
  CREDENTIALS = 'credentials',
  WEB3 = 'web3',
  PROFILE = 'profile',
  CONTACT = 'contact',
}

export enum SubSystem {
  KEY = 'key',
  DID_PROVIDER = 'did_provider',
  DID_RESOLVER = 'did_resolver',
  OID4VP_OP = 'oid4vp_op',
  OID4VCI_CLIENT = 'oid4vci_client',
  SIOPv2_OP = 'siopv2_op',
  CONTACT_MANAGER = 'contact_manager',
  VC_ISSUER = 'vc_issuer',
  VC_VERIFIER = 'vc_verifier',
  VC_PERSISTENCE = 'vc_persistence',
  TRANSPORT = 'transport',
  PROFILE = 'profile',
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
}

export enum DefaultActionSubType {
  KEY_GENERATION = 'Key generation',
  KEY_IMPORT = 'Key import',
  KEY_PERSISTENCE = 'Key persistence',
  KEY_REMOVAL = 'Key removal',
  DID_CREATION = 'DID creation',
  DID_RESOLUTION = 'DID resolution',
  DID_SERVICE_UPDATE = 'DID service update',
  VC_ISSUE = 'VC issue',
  VC_VERIFY = 'VC verify',
}

export type ActionSubType = DefaultActionSubType | string

export enum InitiatorType {
  USER = 'user',
  SYSTEM = 'system',
  EXTERNAL = 'external',
}

export enum SystemCorrelationIdType {
  DID = 'did',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  PHONE = 'phone',
  USER = 'user',
}

export enum PartyCorrelationType {
  DID = 'did',
  EMAIL = 'email',
  HOSTNAME = 'hostname',
  PHONE = 'phone',
}

export enum LoggingEventType {
  AUDIT = 'audit',
}

export type AuditLoggingEvent = {
  id: string
  timestamp: Date
  level: LogLevel
  correlationId: string
  system: System
  subSystemType: SubSystem
  actionType: ActionType
  actionSubType: ActionSubType
  initiatorType: InitiatorType
  systemCorrelationIdType?: SystemCorrelationIdType
  systemCorrelationId?: string
  systemAlias?: string
  partyCorrelationType?: PartyCorrelationType
  partyCorrelationId?: string
  partyAlias?: string
  description: string
  data?: any
  diagnosticData?: any
}
export type PartialAuditLoggingEvent = Partial<AuditLoggingEvent>

export type NonPersistedAuditLoggingEvent = Omit<AuditLoggingEvent, 'id' | 'timestamp' | 'level' | 'correlationId' | 'system' | 'subSystemType' | 'initiatorType'> & {
  level?: LogLevel
  correlationId?: string
  system?: System
  subSystemType?: SubSystem
  initiatorType?: InitiatorType
}

export type LoggingEvent = {
  type: LoggingEventType
  data: NonPersistedAuditLoggingEvent
}

export type EventLoggerArgs = {
  context?: IAgentContext<any>
  namespace?: string
  system?: System
  subSystem?: SubSystem
  logLevel?: LogLevel
  initiatorType?: InitiatorType
}
