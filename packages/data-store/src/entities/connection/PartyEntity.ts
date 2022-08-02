import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, BaseEntity, OneToMany, Index } from 'typeorm'
import { ConnectionEntity } from './ConnectionEntity'

@Entity('Party')
@Index(['name'], { unique: true })
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('text', { name: 'name', nullable: false })
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
