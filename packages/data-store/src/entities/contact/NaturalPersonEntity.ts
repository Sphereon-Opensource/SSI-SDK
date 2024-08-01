import { Column, ChildEntity, BeforeInsert, BeforeUpdate } from 'typeorm'
import { BaseContactEntity } from './BaseContactEntity'
import { ValidationConstraint } from '../../types'
import { validate, IsNotEmpty, ValidationError, Validate } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@ChildEntity('NaturalPerson')
export class NaturalPersonEntity extends BaseContactEntity {
  @Column('varchar', { name: 'first_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank first names are not allowed' })
  firstName!: string

  @Column('varchar', { name: 'middle_name', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank middle names are not allowed' })
  middleName?: string

  @Column('varchar', { name: 'last_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank last names are not allowed' })
  lastName!: string

  @Column('varchar', { name: 'display_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank display names are not allowed' })
  displayName!: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

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
