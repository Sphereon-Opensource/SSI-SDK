import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ConnectionEntity } from './ConnectionEntity'

@Entity('Party')
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('text', { name: 'party_name', nullable: false, unique: true })
  name!: string

  @OneToMany(() => ConnectionEntity, (connection: ConnectionEntity) => connection.party, { cascade: true })
  @JoinColumn()
  connections!: Array<ConnectionEntity>
}

export const partyEntityFrom = (name: string): PartyEntity => {
  const partyEntity = new PartyEntity()
  partyEntity.name = name

  return partyEntity
}
