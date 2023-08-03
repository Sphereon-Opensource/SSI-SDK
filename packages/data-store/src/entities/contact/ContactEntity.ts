import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  FindOptionsWhere,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  BasicContactOwner,
  BasicOrganization,
  BasicPerson,
  ContactOwner,
  IBasicContact,
  IBasicIdentity,
  IContact,
  ValidationConstraint
} from '../../types'
import { IdentityEntity, identityEntityFrom, identityFrom } from './IdentityEntity'
import { validate, ValidationError } from 'class-validator'
import { ContactTypeEntity, contactTypeEntityFrom, contactTypeFrom } from './ContactTypeEntity'
import {
  ContactOwnerEntity,
  isOrganization,
  isPerson
} from './ContactOwnerEntity'
import { PersonEntity, personEntityFrom, personFrom } from './PersonEntity'
import { OrganizationEntity, organizationEntityFrom, organizationFrom } from './OrganizationEntity'
import { ContactRelationshipEntity, contactRelationshipFrom } from './ContactRelationshipEntity'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('Contact')
export class ContactEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'uri', length: 255 })
  uri?: string

  @OneToMany(() => IdentityEntity, (identity: IdentityEntity) => identity.contact, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'identityId' })
  identities!: Array<IdentityEntity>

  @ManyToOne(() => ContactTypeEntity, (contactType: ContactTypeEntity) => contactType.contacts, {
    cascade: true,
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'contactTypeId' })
  contactType!: ContactTypeEntity

  @OneToOne(() => ContactOwnerEntity, (owner: PersonEntity | OrganizationEntity) => owner.contact, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  contactOwner!: ContactOwnerEntity

  @OneToMany(() => ContactRelationshipEntity, (relationship: ContactRelationshipEntity) => relationship.left, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'relationshipId' })
  relationships!: Array<ContactRelationshipEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  async checkUniqueCocNumberAndTenantId(): Promise<undefined> {
    const result: Array<ContactEntity> = await ContactEntity.find({
      where: {
        contactOwner: {
          cocNumber: (<OrganizationEntity>this.contactOwner).cocNumber,
        } as FindOptionsWhere<PersonEntity | OrganizationEntity>,
        contactType: {
          tenantId: this.contactType.tenantId,
        },
      },
    })

    if (result?.length > 0) {
      return Promise.reject(Error('Coc number already in use'))
    }

    return
  }

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

export const contactEntityFrom = (contact: IBasicContact): ContactEntity => {
  const contactEntity: ContactEntity = new ContactEntity()
  contactEntity.uri = contact.uri
  contactEntity.identities = contact.identities ? contact.identities.map((identity: IBasicIdentity) => identityEntityFrom(identity)) : []
  contactEntity.contactType = contactTypeEntityFrom(contact.contactType)
  contactEntity.contactOwner = contactOwnerEntityFrom(contact.contactOwner)

  return contactEntity
}

export const contactFrom = (contact: ContactEntity): IContact => {
  return {
    id: contact.id,
    uri: contact.uri,
    roles: [...new Set(contact.identities?.flatMap((identity: IdentityEntity) => identity.roles))] ?? [],
    identities: contact.identities ? contact.identities.map((identity: IdentityEntity) => identityFrom(identity)) : [],
    relationships: contact.relationships
      ? contact.relationships.map((relationship: ContactRelationshipEntity) => contactRelationshipFrom(relationship))
      : [],
    contactType: contactTypeFrom(contact.contactType),
    contactOwner: contactOwnerFrom(contact.contactOwner),
    createdAt: contact.createdAt,
    lastUpdatedAt: contact.lastUpdatedAt,
  }
}

export const contactOwnerEntityFrom = (owner: BasicContactOwner): ContactOwnerEntity => {
  if (isPerson(owner)) {
    return personEntityFrom(<BasicPerson>owner)
  } else if (isOrganization(owner)) {
    return organizationEntityFrom(<BasicOrganization>owner)
  }

  throw new Error('Owner type not supported')
}

export const contactOwnerFrom = (owner: ContactOwnerEntity): ContactOwner => {
  if (isPerson(owner)) {
    return personFrom(owner)
  } else if (isOrganization(owner)) {
    return organizationFrom(owner)
  }

  throw new Error('Owner type not supported')
}
