import { BaseEntity, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm'
import { ContactEntity } from './ContactEntity'
import { BasicContactOwner, BasicOrganization, BasicPerson } from '../../types'
import { PersonEntity } from './PersonEntity'
import { OrganizationEntity } from './OrganizationEntity'

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

export const isPerson = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicPerson | PersonEntity =>
  'firstName' in owner && 'middleName' in owner && 'lastName' in owner

export const isOrganization = (owner: BasicContactOwner | ContactOwnerEntity): owner is BasicOrganization | OrganizationEntity => 'legalName' in owner
