import { ChildEntity, Column, JoinColumn, ManyToOne, Index } from 'typeorm'
import { IBasicCredentialLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'

@ChildEntity('CredentialLocaleBranding')
//@Unique('name',['credentialBranding', 'locale'], { message: 'Custom error message: Duplicate credential branding and locale combination.' })
//@Unique(['credentialBranding', 'locale'])
@Index('IDX_CredentialLocaleBrandingEntity_issuerBranding_locale', ['credentialBranding', 'locale'], { unique: true })
export class CredentialLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialBrandingId' })
  credentialBranding!: CredentialBrandingEntity

  @Column({ name: 'credentialBrandingId', nullable: false })
  credentialBrandingId!: string
}

export const credentialLocaleBrandingEntityFrom = (args: IBasicCredentialLocaleBranding): CredentialLocaleBrandingEntity => {
  const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = new CredentialLocaleBrandingEntity()
  credentialLocaleBrandingEntity.alias = args.alias
  credentialLocaleBrandingEntity.locale = args.locale
  credentialLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  credentialLocaleBrandingEntity.description = args.description
  credentialLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  credentialLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return credentialLocaleBrandingEntity
}
