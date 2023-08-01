import { JoinColumn, OneToOne, Column, ChildEntity, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ContactEntity } from './ContactEntity'
import { ContactOwnerEntity } from './ContactOwnerEntity'
import { BasicOrganization, IOrganization, ValidationConstraint } from '../../types'
import { validate, IsNotEmpty, ValidationError, Validate } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@ChildEntity('Organization')
export class OrganizationEntity extends ContactOwnerEntity {
  @Column({ name: 'legalName', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank legal names are not allowed' })
  legalName!: string

  @Column({ name: 'displayName', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank display names are not allowed' })
  displayName!: string

  // TODO uniek per tenant
  @Column({ name: 'cocNumber', length: 255, nullable: true, unique: true })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank coc numbers are not allowed' })
  cocNumber?: string

  @OneToOne(() => ContactEntity)
  @JoinColumn({ name: 'contactId' })
  contact!: ContactEntity

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

export const organizationEntityFrom = (organization: BasicOrganization): OrganizationEntity => {
  const organizationEntity: OrganizationEntity = new OrganizationEntity()
  organizationEntity.legalName = organization.legalName
  organizationEntity.displayName = organization.displayName
  organizationEntity.cocNumber = organization.cocNumber

  return organizationEntity
}

export const organizationFrom = (organization: OrganizationEntity): IOrganization => {
  return {
    id: organization.id,
    legalName: organization.legalName,
    displayName: organization.displayName,
    cocNumber: organization.cocNumber,
    createdAt: organization.createdAt,
    lastUpdatedAt: organization.lastUpdatedAt,
  }
}
