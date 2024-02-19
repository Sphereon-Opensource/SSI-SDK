import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";

@Entity('XstateEntity')
export class XStateEntity extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    // @ts-ignore
    id: string
    @Column()
    // @ts-ignore
    state: string
    @Column()
    // @ts-ignore
    type: string
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    // @ts-ignore
    createdAt: Date
    @Column({ type: 'timestamp', onUpdate: 'CURRENT_TIMESTAMP', nullable: true })
    // @ts-ignore
    updatedAt: Date
    @Column({ type: 'timestamp', nullable: true })
    // @ts-ignore
    completedAt: Date
    @Column()
    // @ts-ignore
    tenantId?: string
    @Column({ default: 0 })
    // @ts-ignore
    ttl: number
}
