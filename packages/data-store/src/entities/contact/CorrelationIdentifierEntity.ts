import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm'
import { CorrelationIdentifierEnum, BasicCorrelationIdentifier } from '../../types/contact'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate } from 'class-validator'

@Entity('CorrelationIdentifier')
export class CorrelationIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: CorrelationIdentifierEnum, nullable: false })
  type!: CorrelationIdentifierEnum

  @Column('text', { name: 'correlation_id', nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank correlation ids are not allowed' })
  correlationId!: string

  @OneToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.identifier, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identityId' })
  identity!: IdentityEntity

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    const validation = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(validation[0].constraints?.isNotEmpty))
    }
    return
  }
}

export const correlationIdentifierEntityFrom = (identifier: BasicCorrelationIdentifier): CorrelationIdentifierEntity => {
  const identifierEntity = new CorrelationIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId

  return identifierEntity
}
