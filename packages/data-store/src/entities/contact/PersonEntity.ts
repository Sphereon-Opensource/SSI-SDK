import { Column, ChildEntity, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ContactOwnerEntity } from './ContactOwnerEntity'
import { BasicPerson, IPerson, ValidationConstraint } from '../../types'
import { validate, IsNotEmpty, ValidationError, Validate } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@ChildEntity('Person')
export class PersonEntity extends ContactOwnerEntity {
  @Column({ name: 'firstName', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank first names are not allowed' })
  firstName!: string

  @Column({ name: 'middleName', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank middle names are not allowed' })
  middleName?: string

  @Column({ name: 'lastName', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank last names are not allowed' })
  lastName!: string

  @Column({ name: 'displayName', length: 255, nullable: false, unique: true })
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

export const personEntityFrom = (person: BasicPerson): PersonEntity => {
  const personEntity: PersonEntity = new PersonEntity()
  personEntity.firstName = person.firstName
  personEntity.middleName = person.middleName
  personEntity.lastName = person.lastName
  personEntity.displayName = person.displayName

  return personEntity
}

export const personFrom = (person: PersonEntity): IPerson => {
  return {
    id: person.id,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    displayName: person.displayName,
    createdAt: person.createdAt,
    lastUpdatedAt: person.lastUpdatedAt,
  }
}
