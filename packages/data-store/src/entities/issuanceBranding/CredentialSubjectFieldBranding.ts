import {
  BaseEntity,
  Column,
  Entity,
  // JoinColumn,
  // ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ArrayMinSize } from 'class-validator'
import { FieldLocaleBrandingEntity } from './FieldLocaleBranding'
//import {CredentialBrandingEntity} from './CredentialBrandingEntity';
// import {ImageAttributesEntity} from './ImageAttributesEntity';

@Entity('CredentialSubjectFieldBranding')
export class CredentialSubjectFieldBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // TODO fieldname and credential id needs to be unique
  @Column({ name: 'fieldName', length: 255, nullable: false, unique: false })
  fieldName!: string

  @OneToMany(
    () => FieldLocaleBrandingEntity,
    (fieldLocaleBrandingEntity: FieldLocaleBrandingEntity) => fieldLocaleBrandingEntity.credentialSubjectFieldBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: false,
    }
  )
  @ArrayMinSize(1, { message: 'fieldLocaleBranding cannot be empty' })
  // TODO example on openId shows a field without any branding
  fieldLocaleBranding!: Array<FieldLocaleBrandingEntity>

  // @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.credentialSubjectBranding, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'credentialBrandingId' })
  // credentialBranding!: CredentialBrandingEntity

  // TODO we need a list of fieldBrandings for locales

  // @Column({ name: 'alias', length: 255, nullable: false, unique: true })
  // alias!: string
  //
  // // TODO
  // @OneToOne(() => ImageAttributesEntity, (imageAttributesEntity: ImageAttributesEntity) => imageAttributesEntity.localeBranding, {
  //   cascade: true,
  //   onDelete: 'CASCADE',
  //   eager: true,
  //   nullable: true,
  // })
  // image?: ImageAttributesEntity
}
