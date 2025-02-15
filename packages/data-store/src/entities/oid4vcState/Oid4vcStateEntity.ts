import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'


@Entity('Oid4vcStateEntity')
export class Oid4vcStateEntity<StateType> extends BaseEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', nullable: false })
  id!: string

  @Column({ name: 'lookup_ids', type: 'array', nullable: true })
  lookups?: Array<string>

  @Column({ name: 'state_id', type: 'varchar', nullable: true })
  stateId?: string

  @Column({ name: 'correlation_id', type: 'varchar', nullable: true })
  correlationId?: string

  @Column({ name: 'state', type: 'json', nullable: false })
  state!: StateType

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', nullable: false, type: typeOrmDateTime() })
  updatedAt!: Date

  @Column({ name: 'expires_at', nullable: true, type: typeOrmDateTime() })
  expiresAt?: Date

  @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
  tenantId?: string
}
