import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('StateEntity')
export class StateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string

  @Column({ name: 'state_name', nullable: false })
  stateName!: string

  @Column({ name: 'machine_type', nullable: false })
  machineType!: string

  @Column({ name: 'xstate_event_type', nullable: false })
  xStateEventType!: string

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
