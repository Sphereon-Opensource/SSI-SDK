import { BaseEntity, Column,
  CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { IPartyEntityFromArgs } from '../../types/connections'
import { ConnectionEntity } from './ConnectionEntity'
import { PartyIdentifierEntity, partyIdentifierEntityFrom } from './PartyIdentifierEntity'

@Entity('Party')
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 255, nullable: false, unique: true })
  name!: string

  @Column({ length: 255, nullable: false, unique: true })
  alias!: string

  @OneToOne(() => PartyIdentifierEntity, { cascade: true })
  @JoinColumn()
  identifier!: PartyIdentifierEntity

  @Column({ length: 255, nullable: true, unique: false })
  uri?: string

  @OneToMany(() => ConnectionEntity, (connection: ConnectionEntity) => connection.party, { cascade: true })
  @JoinColumn()
  connections!: Array<ConnectionEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date
}

export const partyEntityFrom = (args: IPartyEntityFromArgs): PartyEntity => {
  const partyEntity = new PartyEntity()
  partyEntity.name = args.name
  partyEntity.alias = args.alias
  partyEntity.identifier = partyIdentifierEntityFrom(args.identifier)
  partyEntity.uri = args.uri

  return partyEntity
}
