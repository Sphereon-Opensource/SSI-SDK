import { BaseEntity, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm'
import { PartyEntity } from './PartyEntity'

@Entity('BaseContact')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseContactEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @OneToOne(() => PartyEntity, (party: PartyEntity) => party.contact, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'party_id' })
  party!: PartyEntity
}
