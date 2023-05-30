import { BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { IIssuanceBranding } from '../../types/issuanceBranding'
import { ImageAttributesEntity, imageAttributesEntityFrom } from './ImageAttributesEntity'
import { BackgroundAttributesEntity, backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { TextAttributesEntity, textAttributesEntityFrom } from './TextAttributesEntity'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'

@Entity('IssuanceBranding')
export class IssuanceBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'alias', length: 255, nullable: true, unique: false })
  alias?: string

  @Column({ name: 'locale', length: 255, nullable: true, unique: false })
  locale?: string

  @OneToOne(() => ImageAttributesEntity, (imageAttributesEntity: ImageAttributesEntity) => imageAttributesEntity.issuanceBranding, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  logo?: ImageAttributesEntity

  @Column({ name: 'description', length: 255, nullable: true, unique: false })
  description?: string

  @OneToOne(
    () => BackgroundAttributesEntity,
    (backgroundAttributesEntity: BackgroundAttributesEntity) => backgroundAttributesEntity.issuanceBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: true,
    }
  )
  background?: BackgroundAttributesEntity

  @OneToOne(() => TextAttributesEntity, (textAttributesEntity: TextAttributesEntity) => textAttributesEntity.issuanceBranding, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  text?: TextAttributesEntity

  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.issuanceBranding, {
    onDelete: 'CASCADE',
  })
  credentialBranding!: CredentialBrandingEntity
}

export const issuanceBrandingEntityFrom = (args: IIssuanceBranding): IssuanceBrandingEntity => {
  // TODO we need types with and without id
  const issuanceBrandingEntity = new IssuanceBrandingEntity()
  issuanceBrandingEntity.alias = args.alias
  issuanceBrandingEntity.locale = args.locale
  issuanceBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  issuanceBrandingEntity.description = args.description
  issuanceBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  issuanceBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return issuanceBrandingEntity
}
