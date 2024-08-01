import { ActionSubType, ActionType, InitiatorType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { NonPersistedAuditLoggingEvent } from '../../types'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'

@Entity('AuditEvents')
export class AuditEventEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'timestamp', nullable: false, unique: false, type: typeOrmDateTime() })
  timestamp!: Date

  @Column('simple-enum', { name: 'level', enum: LogLevel, nullable: false, unique: false })
  level!: LogLevel

  @Column('text', { name: 'correlationId', nullable: false, unique: false })
  correlationId!: string

  @Column('simple-enum', { name: 'system', enum: System, nullable: false, unique: false })
  system!: System

  @Column('simple-enum', { name: 'subSystemType', enum: SubSystem, nullable: false, unique: false })
  subSystemType!: SubSystem

  @Column('simple-enum', { name: 'actionType', enum: ActionType, nullable: false, unique: false })
  actionType!: ActionType

  @Column({ name: 'actionSubType', type: 'varchar', nullable: false, unique: false })
  actionSubType!: ActionSubType

  @Column('simple-enum', { name: 'initiatorType', enum: InitiatorType, nullable: false, unique: false })
  initiatorType!: InitiatorType

  @Column('simple-enum', { name: 'systemCorrelationIdType', enum: SystemCorrelationIdType, nullable: true, unique: false })
  systemCorrelationIdType?: SystemCorrelationIdType

  @Column('text', { name: 'systemCorrelationId', nullable: true, unique: false })
  systemCorrelationId?: string

  @Column('text', { name: 'systemAlias', nullable: true, unique: false })
  systemAlias?: string

  @Column('simple-enum', { name: 'partyCorrelationType', enum: PartyCorrelationType, nullable: true, unique: false })
  partyCorrelationType?: PartyCorrelationType

  @Column('text', { name: 'partyCorrelationId', nullable: true, unique: false })
  partyCorrelationId?: string

  @Column('text', { name: 'partyAlias', nullable: true, unique: false })
  partyAlias?: string

  @Column('text', { name: 'description', nullable: false, unique: false })
  description!: string

  @Column('text', { name: 'data', nullable: true, unique: false })
  data?: string

  @Column('text', { name: 'diagnosticData', nullable: true, unique: false })
  diagnosticData?: string

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false, type: typeOrmDateTime() })
  lastUpdatedAt!: Date
}

export const auditEventEntityFrom = (args: NonPersistedAuditLoggingEvent): AuditEventEntity => {
  const auditEventEntity: AuditEventEntity = new AuditEventEntity()
  auditEventEntity.timestamp = args.timestamp
  auditEventEntity.level = args.level
  auditEventEntity.correlationId = args.correlationId
  auditEventEntity.system = args.system
  auditEventEntity.subSystemType = args.subSystemType
  auditEventEntity.actionType = args.actionType
  auditEventEntity.actionSubType = args.actionSubType
  auditEventEntity.initiatorType = args.initiatorType
  auditEventEntity.systemCorrelationIdType = args.systemCorrelationIdType
  auditEventEntity.systemCorrelationId = args.systemCorrelationId
  auditEventEntity.systemAlias = args.systemAlias
  auditEventEntity.partyCorrelationType = args.partyCorrelationType
  auditEventEntity.partyCorrelationId = args.partyCorrelationId
  auditEventEntity.partyAlias = args.partyAlias
  auditEventEntity.description = args.description
  auditEventEntity.partyCorrelationType = args.partyCorrelationType
  auditEventEntity.data = JSON.stringify(args.data)
  auditEventEntity.diagnosticData = JSON.stringify(args.diagnosticData)

  return auditEventEntity
}
