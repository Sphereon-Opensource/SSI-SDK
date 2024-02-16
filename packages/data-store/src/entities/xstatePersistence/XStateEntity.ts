import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";

@Entity('XstateEntity')
export class XStateEntity extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    id: string
    @Column()
    state: string
    @Column()
    type: string
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date
    @Column({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP', nullable: true })
    updatedAt: Date
    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date
    @Column()
    tenantId?: string
    @Column({ default: 0 })
    ttl: number
}