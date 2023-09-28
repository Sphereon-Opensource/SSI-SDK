import { JoinColumn, OneToOne, Column, ChildEntity, BeforeInsert, BeforeUpdate } from 'typeorm'
import { PartyEntity } from './PartyEntity'
import { BaseContactEntity } from './BaseContactEntity'
import { ValidationConstraint } from '../../types'
import { validate, IsNotEmpty, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

@ChildEntity('Organization')
export class OrganizationEntity extends BaseContactEntity {
  @Column({ name: 'legal_name', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank legal names are not allowed' })
  legalName!: string

  @Column({ name: 'display_name', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank display names are not allowed' })
  displayName!: string

  @OneToOne(() => PartyEntity)
  @JoinColumn({ name: 'party_id' })
  party!: PartyEntity

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
