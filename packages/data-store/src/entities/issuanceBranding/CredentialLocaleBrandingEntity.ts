import { BeforeInsert, BeforeUpdate, ChildEntity, Column, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { computeCompactHash } from '../../utils/issuanceBranding/HashUtils'
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

  @Column('varchar', { name: 'state', length: 255, nullable: false })
  state!: string

  @BeforeInsert()
  @BeforeUpdate()
  setState(): void {
    this.state = computeCredentialLocaleBrandingState(this)
  }
}

export const computeCredentialLocaleBrandingState = (localeBranding: CredentialLocaleBrandingEntity): string => {
  const sortedClaims: Array<{ key: string; name: string }> = (localeBranding.claims ?? [])
    .map((claim: CredentialClaimsEntity) => ({ key: claim.key, name: claim.name }))
    .sort((first: { key: string }, second: { key: string }) => first.key.localeCompare(second.key))

  const payload = {
    alias: localeBranding.alias ?? null,
    locale: localeBranding.locale ?? null,
    description: localeBranding.description ?? null,
    logo: localeBranding.logo
      ? {
          uri: localeBranding.logo.uri ?? null,
          dataUri: localeBranding.logo.dataUri ?? null,
          mediaType: localeBranding.logo.mediaType ?? null,
          alt: localeBranding.logo.alt ?? null,
          dimensions: localeBranding.logo.dimensions
            ? {
                width: localeBranding.logo.dimensions.width,
                height: localeBranding.logo.dimensions.height,
              }
            : null,
        }
      : null,
    background: localeBranding.background
      ? {
          color: localeBranding.background.color ?? null,
          image: localeBranding.background.image
            ? {
                uri: localeBranding.background.image.uri ?? null,
                dataUri: localeBranding.background.image.dataUri ?? null,
                mediaType: localeBranding.background.image.mediaType ?? null,
                alt: localeBranding.background.image.alt ?? null,
                dimensions: localeBranding.background.image.dimensions
                  ? {
                      width: localeBranding.background.image.dimensions.width,
                      height: localeBranding.background.image.dimensions.height,
                    }
                  : null,
              }
            : null,
        }
      : null,
    text: localeBranding.text
      ? {
          color: localeBranding.text.color ?? null,
        }
      : null,
    claims: sortedClaims,
  }

  return computeCompactHash(JSON.stringify(payload))
}
