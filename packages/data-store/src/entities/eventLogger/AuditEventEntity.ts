import { ActionSubType, ActionType, InitiatorType, LogLevel, SubSystem, System, SystemCorrelationIdType } from '@sphereon/ssi-types'
import { PartyCorrelationType } from '@sphereon/ssi-sdk.core'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

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
