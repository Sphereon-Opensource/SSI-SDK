import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { IPartyEntityFromArgs } from '../../types/connections'
import { ConnectionEntity } from './ConnectionEntity'

@Entity('Party')
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 255, nullable: false, unique: true })
  name!: string

  @Column({ length: 255, nullable: false, unique: true })
  alias!: string

  @Column({ length: 255, nullable: true, unique: false })
  uri!: string

  @OneToMany(() => ConnectionEntity, (connection: ConnectionEntity) => connection.party, { cascade: true })
  @JoinColumn()
  connections!: Array<ConnectionEntity>
}

export const partyEntityFrom = (args: IPartyEntityFromArgs): PartyEntity => {
  const partyEntity = new PartyEntity()
  partyEntity.name = args.name
  partyEntity.alias = args.alias
  partyEntity.uri = args.uri

  return partyEntity
}
