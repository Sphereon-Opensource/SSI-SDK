import { BeforeInsert, BeforeUpdate, ChildEntity, Column } from 'typeorm'
import { BaseContactEntity } from './BaseContactEntity'
import { ValidationConstraint } from '../../types'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

@ChildEntity('NaturalPerson')
export class NaturalPersonEntity extends BaseContactEntity {
  @Column({ name: 'first_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank first names are not allowed' })
  firstName!: string

  @Column({ name: 'middle_name', length: 255, nullable: true, unique: false })
  middleName?: string

  @Column({ name: 'last_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank last names are not allowed' })
  lastName!: string

  @Column({ name: 'display_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank display names are not allowed' })
  displayName!: string

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
