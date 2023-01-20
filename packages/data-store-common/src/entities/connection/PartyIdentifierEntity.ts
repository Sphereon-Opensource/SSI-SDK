import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm'
import {
  CorrelationIdentifierEnum,
  BasicPartyIdentifier
} from '../../types/connections'

@Entity('PartyIdentifier')
export class PartyIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { nullable: false, enum: CorrelationIdentifierEnum })
  type!: CorrelationIdentifierEnum

  @Column('text', { name: 'correlation_id', nullable: false })
  correlationId!: string
}

export const partyIdentifierEntityFrom = (identifier: BasicPartyIdentifier): PartyIdentifierEntity => {
  const identifierEntity = new PartyIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId

  return identifierEntity
}
