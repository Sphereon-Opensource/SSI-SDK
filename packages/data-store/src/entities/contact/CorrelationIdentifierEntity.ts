import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToOne, JoinColumn } from 'typeorm'
import { CorrelationIdentifierEnum, BasicCorrelationIdentifier } from '../../types/contact'
import { IdentityEntity } from './IdentityEntity'

@Entity('CorrelationIdentifier')
export class CorrelationIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: CorrelationIdentifierEnum, nullable: false })
  type!: CorrelationIdentifierEnum

  @Column('text', { name: 'correlation_id', nullable: false, unique: true })
  correlationId!: string

  @OneToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.identifier, {
    // cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identityId' })
  identity!: IdentityEntity
}

export const correlationIdentifierEntityFrom = (identifier: BasicCorrelationIdentifier): CorrelationIdentifierEntity => {
  const identifierEntity = new CorrelationIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId

  return identifierEntity
}
