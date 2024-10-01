import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'

/**
 * @class MachineStateInfoEntity
 * Represents a machine state. It allows to continue a machine at a later point in time at the point it was left of
 *
 * @param {string} instanceId - The instance ID of the machine state.
 * @param {string} [sessionId] - The session ID of the machine state. (optional)
 * @param {string} machineName - The name of the machine.
 * @param {string} [latestStateName] - The name of the latest state. (optional)
 * @param {string} latestEventType - The type of the latest event.
 * @param {string} state - The current state of the machine.
 * @param {Date} createdAt - The date and time when the machine state was created.
 * @param {Date} updatedAt - The date and time when the machine state was last updated.
 * @param {number} updatedCount - The number of times the machine state has been updated.
 * @param {Date} [expiresAt] - The date and time when the machine state expires. (optional)
 * @param {Date} [completedAt] - The date and time when the machine state was completed. (optional)
 * @param {string} [tenantId] - The ID of the tenant associated with the machine state. (optional)
 */
@Entity('MachineStateInfoEntity')
export class MachineStateInfoEntity extends BaseEntity {
  @PrimaryColumn({ name: 'instance_id', type: 'varchar', nullable: false })
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

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', nullable: false, type: typeOrmDateTime() })
  updatedAt!: Date

  @Column({ name: 'updated_count', type: 'integer', nullable: false })
  updatedCount!: number

  @Column({ name: 'expires_at', nullable: true, type: typeOrmDateTime() })
  expiresAt?: Date

  @Column({ name: 'completed_at', nullable: true, type: typeOrmDateTime() })
  completedAt?: Date

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId?: string
}
