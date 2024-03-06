import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('MachineStateInfoEntity')
export class MachineStateInfoEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id' })
  id!: string

  @Column({ name: 'machine_id', nullable: false })
  machineId!: string

  @Column({ name: 'latest_state_name', nullable: false })
  latestStateName!: string

  @Column({ name: 'latest_event_type', nullable: false })
  latestEventType!: string

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
