import { ChildEntity, Column, JoinColumn, ManyToOne, Index } from 'typeorm'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'

@ChildEntity('CredentialLocaleBranding')
@Index('IDX_CredentialLocaleBrandingEntity_credentialBranding_locale', ['credentialBranding', 'locale'], { unique: true })
export class CredentialLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialBrandingId' })
  credentialBranding!: CredentialBrandingEntity

  @Column('text', { name: 'credentialBrandingId', nullable: false })
  credentialBrandingId!: string
}
