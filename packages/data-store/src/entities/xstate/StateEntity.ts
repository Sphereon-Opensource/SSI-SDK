import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { NonPersistedXStateStoreEvent } from '../../types'

@Entity('StateEntity')
export class StateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string

  @Column({ name: 'step', nullable: false })
  step!: string

  @Column({ name: 'type', nullable: false })
  type!: string

  @Column({ name: 'event_name', nullable: false })
  eventName!: string

  @Column({ name: 'state', nullable: false })
  state!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  updatedAt!: Date

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId?: string
}

export const stateEntityFrom = (args: NonPersistedXStateStoreEvent): StateEntity => {
  const stateEntity = new StateEntity()
  stateEntity.step = args.step
  stateEntity.type = args.type
  stateEntity.eventName = args.eventName
  stateEntity.state = args.state
  stateEntity.expiresAt = args.expiresAt
  stateEntity.completedAt = args.completedAt
  stateEntity.tenantId = args.tenantId
  return stateEntity
}
