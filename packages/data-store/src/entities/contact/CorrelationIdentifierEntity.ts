import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm'
import { CorrelationIdentifierEnum, BasicCorrelationIdentifier, ICorrelationIdentifier, ValidationConstraint } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

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
  async validate(): Promise<void> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      const constraint: ValidationConstraint | undefined = getConstraint(validation[0])
      if (constraint) {
        const message: string = Object.values(constraint!)[0]
        return Promise.reject(Error(message))
      }
    }
  }
}

export const correlationIdentifierEntityFrom = (identifier: BasicCorrelationIdentifier): CorrelationIdentifierEntity => {
  const identifierEntity: CorrelationIdentifierEntity = new CorrelationIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId

  return identifierEntity
}

export const correlationIdentifierFrom = (identifier: CorrelationIdentifierEntity): ICorrelationIdentifier => {
  return {
    id: identifier.id,
    type: identifier.type,
    correlationId: identifier.correlationId,
  }
}
