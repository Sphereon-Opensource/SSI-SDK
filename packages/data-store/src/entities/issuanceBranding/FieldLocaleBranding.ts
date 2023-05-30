import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CredentialSubjectFieldBrandingEntity } from './CredentialSubjectFieldBranding'

@Entity('FieldLocaleBranding')
export class FieldLocaleBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'fieldName', length: 255, nullable: false, unique: false })
  alias!: string

  // TODO should now be not null since we get duplicates with null?
  @Column({ name: 'locale', length: 255, nullable: true, unique: false })
  locale?: string

  // IMAGE

  @ManyToOne(
    () => CredentialSubjectFieldBrandingEntity,
    (credentialSubjectFieldBranding: CredentialSubjectFieldBrandingEntity) => credentialSubjectFieldBranding.fieldLocaleBranding,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'credentialSubjectFieldBrandingId' })
  credentialSubjectFieldBranding!: CredentialSubjectFieldBrandingEntity
}
