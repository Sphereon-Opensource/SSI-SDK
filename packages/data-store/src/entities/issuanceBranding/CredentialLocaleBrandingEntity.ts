import { ChildEntity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { IBasicLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'

@ChildEntity('CredentialLocaleBranding')
@Index(['credentialBranding', 'locale'], { unique: true })
export class CredentialLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialBrandingId' })
  credentialBranding!: CredentialBrandingEntity
}

export const credentialLocaleBrandingEntityFrom = (args: IBasicLocaleBranding): CredentialLocaleBrandingEntity => {
  const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = new CredentialLocaleBrandingEntity()
  credentialLocaleBrandingEntity.alias = args.alias
  credentialLocaleBrandingEntity.locale = args.locale
  credentialLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  credentialLocaleBrandingEntity.description = args.description
  credentialLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  credentialLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return credentialLocaleBrandingEntity
}
