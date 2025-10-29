import { Validate } from 'class-validator'
import { ChildEntity, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
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
}
