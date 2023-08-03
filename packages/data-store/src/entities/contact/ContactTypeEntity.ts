import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ContactEntity } from './ContactEntity'
import { BasicContactType, ContactTypeEnum, IContactType, ValidationConstraint } from '../../types'
import { IsNotEmpty, Validate, validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('ContactType')
@Index(['type', 'tenantId'], { unique: true }) // TODO name example: 'IDX_CredentialLocaleBrandingEntity_credentialBranding_locale',
export class ContactTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: ContactTypeEnum, nullable: false, unique: false })
  type!: ContactTypeEnum

  @Column({ name: 'name', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank names are not allowed' })
  name!: string

  @Column({ name: 'description', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank descriptions are not allowed' })
  description?: string

  @Column({ name: 'tenantId', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: "Blank tenant id's are not allowed" })
  tenantId!: string

  @OneToMany(() => ContactEntity, (contact: ContactEntity) => contact.contactType, {
    nullable: false,
  })
  contacts!: Array<ContactEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

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

export const contactTypeEntityFrom = (args: BasicContactType): ContactTypeEntity => {
  const contactTypeEntity: ContactTypeEntity = new ContactTypeEntity()
  if (args.id) {
    contactTypeEntity.id = args.id
  }
  contactTypeEntity.type = args.type
  contactTypeEntity.name = args.name
  contactTypeEntity.description = args.description
  contactTypeEntity.tenantId = args.tenantId

  return contactTypeEntity
}

export const contactTypeFrom = (contactType: ContactTypeEntity): IContactType => {
  return {
    id: contactType.id,
    type: contactType.type,
    name: contactType.name,
    tenantId: contactType.tenantId,
    description: contactType.description,
    createdAt: contactType.createdAt,
    lastUpdatedAt: contactType.lastUpdatedAt,
  }
}
