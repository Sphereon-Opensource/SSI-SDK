import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";

@Entity('state')
export class State extends BaseEntity {
    @PrimaryColumn()
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
    tenantId: string
    @Column()
    // @ts-ignore
    ttl: number
}