import { ChildEntity, Column, JoinColumn, ManyToOne, Index } from 'typeorm'
import { IBasicCredentialLocaleBranding } from '../../types/index.mjs'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity.mjs'
import { CredentialBrandingEntity } from './CredentialBrandingEntity.mjs'
import { imageAttributesEntityFrom } from './ImageAttributesEntity.mjs'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity.mjs'
import { textAttributesEntityFrom } from './TextAttributesEntity.mjs'
import { isEmptyString } from '../validators/index.mjs'

@ChildEntity('CredentialLocaleBranding')
@Index('IDX_CredentialLocaleBrandingEntity_credentialBranding_locale', ['credentialBranding', 'locale'], { unique: true })
export class CredentialLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialBrandingId' })
  credentialBranding!: CredentialBrandingEntity

  @Column({ name: 'credentialBrandingId', type: 'varchar', nullable: false })
  credentialBrandingId!: string
}

export const credentialLocaleBrandingEntityFrom = (args: IBasicCredentialLocaleBranding): CredentialLocaleBrandingEntity => {
  const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = new CredentialLocaleBrandingEntity()
  credentialLocaleBrandingEntity.alias = isEmptyString(args.alias) ? undefined : args.alias
  credentialLocaleBrandingEntity.locale = args.locale ? args.locale : ''
  credentialLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  credentialLocaleBrandingEntity.description = isEmptyString(args.description) ? undefined : args.description
  credentialLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  credentialLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return credentialLocaleBrandingEntity
}
