import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm'
import { CorrelationIdentifierType, ValidationConstraint } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('CorrelationIdentifier')
export class CorrelationIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: CorrelationIdentifierType, nullable: false })
  type!: CorrelationIdentifierType

  @Column('text', { name: 'correlation_id', nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank correlation ids are not allowed' })
  correlationId!: string

  @OneToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.identifier, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identity_id' })
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
