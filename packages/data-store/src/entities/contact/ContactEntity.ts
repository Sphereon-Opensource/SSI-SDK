import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
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
  ValidationConstraint,
} from '../../types'
import { IdentityEntity, identityEntityFrom, identityFrom } from './IdentityEntity'
import { validate, ValidationError } from 'class-validator'
import { ContactTypeEntity, contactTypeEntityFrom, contactTypeFrom } from './ContactTypeEntity'
import { ContactOwnerEntity } from './ContactOwnerEntity'
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
    // cascade: ['insert', 'update'],
    cascade: true,
    // onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  }) // TODO check these options
  @JoinColumn({ name: 'contactTypeId' })
  contactType!: ContactTypeEntity

  @OneToOne(() => ContactOwnerEntity, (member: PersonEntity | OrganizationEntity) => member.contact, {
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

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateLastUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
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

// TODO move
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
    // @ts-ignore
    return personFrom(owner)
  } else if (isOrganization(owner)) {
    // @ts-ignore
    return organizationFrom(owner)
  }

  throw new Error('Owner type not supported')
}

// TODO move?
const isPerson = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicPerson =>
  'firstName' in owner && 'middleName' in owner && 'lastName' in owner

const isOrganization = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicOrganization => 'legalName' in owner && 'cocNumber' in owner
