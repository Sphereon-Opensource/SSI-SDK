import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('MachineStateInfoEntity')
export class MachineStateInfoEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'instance_id' })
  instanceId!: string

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId?: string

  // Xstate moved to name instead of instanceId for V5. Also makes more sense
  @Column({ name: 'machine_name', type: 'varchar', nullable: false })
  machineName!: string

  @Column({ name: 'latest_state_name', type: 'varchar', nullable: true })
  latestStateName?: string

  @Column({ name: 'latest_event_type', type: 'varchar', nullable: false })
  latestEventType!: string

  @Column({ name: 'state', type: 'text', nullable: false })
  state!: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: false })
  updatedAt!: Date

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId?: string
}
