import { BaseEntity, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm'
import { ContactEntity } from './ContactEntity'
// import { IPerson } from '../../types'
// import { PersonEntity } from './PersonEntity'
// import {
//   // BasicContactOwner,
//   // BasicOrganization,
//   // BasicPerson,
//   // ContactOwner
// } from '../../types'
// import { organizationEntityFrom, organizationFrom } from './OrganizationEntity'
// import { personEntityFrom, personFrom } from './PersonEntity'

@Entity('ContactOwner')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class ContactOwnerEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @OneToOne(() => ContactEntity, (contact: ContactEntity) => contact.contactOwner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact!: ContactEntity
}

// export const contactOwnerEntityFrom = (owner: BasicContactOwner): ContactOwnerEntity => {
//   if (isPerson(owner)) {
//     return personEntityFrom(<BasicPerson>owner)
//   } else if (isOrganization(owner)) {
//     return organizationEntityFrom(<BasicOrganization>owner)
//   }
//
//   throw new Error('Owner type not supported')
//
//
//   // switch (type) {
//   //   case ContactTypeEnum.PERSON:
//   //     return personEntityFrom(<BasicPerson>owner)
//   //   case ContactTypeEnum.ORGANIZATION:
//   //     return organizationEntityFrom(<BasicOrganization>owner)
//   //   default:
//   //     throw new Error('Contact type not supported')
//   // }
// }

// export const contactOwnerFrom = (owner: ContactOwnerEntity): ContactOwner => {
//   if (isPerson(owner)) {
//     // @ts-ignore
//     return personFrom(owner)
//   } else if (isOrganization(owner)) {
//     // @ts-ignore
//     return organizationFrom(owner)
//   }
//
//   throw new Error('Owner type not supported')
// }
//
// // TODO move?
// const isPerson = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicPerson =>
//   'firstName' in owner && 'middleName' in owner && 'lastName' in owner
//
// const isOrganization = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicOrganization =>
//   'legalName' in owner && 'cocNumber' in owner

// export const personFrom = (person: PersonEntity): IPerson => {
//   return {
//     id: person.id,
//     firstName: person.firstName,
//     middleName: person.middleName,
//     lastName: person.lastName,
//     displayName: person.displayName,
//     createdAt: person.createdAt,
//     lastUpdatedAt: person.lastUpdatedAt,
//   }
// }
