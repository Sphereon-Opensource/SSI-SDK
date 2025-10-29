import { ChildEntity, Column, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { CredentialBrandingEntity } from './CredentialBrandingEntity'
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

  @Column('uuid', { name: 'credentialBrandingId', nullable: false })
  credentialBrandingId!: string
}
