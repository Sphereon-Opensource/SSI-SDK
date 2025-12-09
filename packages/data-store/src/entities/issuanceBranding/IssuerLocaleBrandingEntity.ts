import { Validate } from 'class-validator'
import { BeforeInsert, BeforeUpdate, ChildEntity, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
import { computeCompactHash } from '../../utils/issuanceBranding/HashUtils'
import { IsNonEmptyStringConstraint } from '../validators'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { IssuerBrandingEntity } from './IssuerBrandingEntity'

@ChildEntity('IssuerLocaleBranding')
@Index('IDX_IssuerLocaleBrandingEntity_issuerBranding_locale', ['issuerBranding', 'locale'], { unique: true })
export class IssuerLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => IssuerBrandingEntity, (issuerBranding: IssuerBrandingEntity) => issuerBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issuerBrandingId' })
  issuerBranding!: IssuerBrandingEntity

  @Column('text', { name: 'client_uri', nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank client uris are not allowed' })
  clientUri?: string

  @Column('text', { name: 'tos_uri', nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank tos uris are not allowed' })
  tosUri?: string

  @Column('text', { name: 'policy_uri', nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank policy uris are not allowed' })
  policyUri?: string

  @Column('simple-array', { name: 'contacts', nullable: true, unique: false })
  contacts?: Array<string>

  @Column('text', { name: 'issuerBrandingId', nullable: false })
  issuerBrandingId!: string

  @Column('varchar', { name: 'state', length: 255, nullable: false })
  state!: string

  @BeforeInsert()
  @BeforeUpdate()
  setState(): void {
    this.state = this.computeState()
  }

  private computeState(): string {
    const payload = {
      alias: this.alias ?? null,
      locale: this.locale ?? null,
      description: this.description ?? null,
      clientUri: this.clientUri ?? null,
      tosUri: this.tosUri ?? null,
      policyUri: this.policyUri ?? null,
      contacts: this.contacts ?? null,
      logo: this.logo
        ? {
            uri: this.logo.uri ?? null,
            dataUri: this.logo.dataUri ?? null,
            mediaType: this.logo.mediaType ?? null,
            alt: this.logo.alt ?? null,
            dimensions: this.logo.dimensions
              ? {
                  width: this.logo.dimensions.width,
                  height: this.logo.dimensions.height,
                }
              : null,
          }
        : null,
      background: this.background
        ? {
            color: this.background.color ?? null,
            image: this.background.image
              ? {
                  uri: this.background.image.uri ?? null,
                  dataUri: this.background.image.dataUri ?? null,
                  mediaType: this.background.image.mediaType ?? null,
                  alt: this.background.image.alt ?? null,
                  dimensions: this.background.image.dimensions
                    ? {
                        width: this.background.image.dimensions.width,
                        height: this.background.image.dimensions.height,
                      }
                    : null,
                }
              : null,
          }
        : null,
      text: this.text
        ? {
            color: this.text.color ?? null,
          }
        : null,
    }

    return computeCompactHash(JSON.stringify(payload))
  }
}
