import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import {NonPersistedXStateStoreEvent} from "../../types";

@Entity('StateEntity')
export class StateEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id!: string

    @Column({ name: 'state', nullable: false })
    state!: string

    @Column({ name: 'type', nullable: false })
    type!: string

    @CreateDateColumn({ name: 'created_at', nullable: false })
    createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at', nullable: false })
    updatedAt!: Date

    @Column({ name: 'completed_at', type: 'date', nullable: true })
    completedAt?: Date

    @Column({ name: 'tenant_id', type: 'varchar', nullable: true })
    tenantId?: string

    @Column({ name: 'ttl', default: 0 })
    ttl!: number
}

export const stateEntityFrom = (args: NonPersistedXStateStoreEvent): StateEntity => {
    const stateEntity = new StateEntity()
    stateEntity.state = args.state
    stateEntity.type = args.type
    stateEntity.completedAt = args.completedAt
    stateEntity.tenantId = args.tenantId
    stateEntity.ttl = args.ttl
    return stateEntity
}
