import { ChildEntity, Column, JoinColumn, ManyToOne, Index, OneToMany } from 'typeorm'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { CredentialClaimsEntity } from './CredentialClaimsEntity'

@ChildEntity('CredentialLocaleBranding')
@Index('IDX_CredentialLocaleBrandingEntity_credentialBranding_locale', ['credentialBranding', 'locale'], { unique: true })
export class CredentialLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => CredentialBrandingEntity, (credentialBranding: CredentialBrandingEntity) => credentialBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialBrandingId' })
  credentialBranding!: CredentialBrandingEntity

  @OneToMany(() => CredentialClaimsEntity, (claims: CredentialClaimsEntity) => claims.credentialLocaleBranding, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'claim_id' })
  claims!: Array<CredentialClaimsEntity>

  @Column('text', { name: 'credentialBrandingId', nullable: false })
  credentialBrandingId!: string
}
