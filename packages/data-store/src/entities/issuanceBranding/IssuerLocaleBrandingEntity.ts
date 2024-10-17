import { ChildEntity, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
import { IBasicIssuerLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { IssuerBrandingEntity } from './IssuerBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'
import { isEmptyString, IsNonEmptyStringConstraint } from '../validators'
import { Validate } from 'class-validator'

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

export const issuerLocaleBrandingEntityFrom = (args: IBasicIssuerLocaleBranding): IssuerLocaleBrandingEntity => {
  const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = new IssuerLocaleBrandingEntity()
  issuerLocaleBrandingEntity.alias = isEmptyString(args.alias) ? undefined : args.alias
  issuerLocaleBrandingEntity.locale = args.locale ? args.locale : ''
  issuerLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  issuerLocaleBrandingEntity.description = isEmptyString(args.description) ? undefined : args.description
  issuerLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  issuerLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined
  issuerLocaleBrandingEntity.clientUri = isEmptyString(args.clientUri) ? undefined : args.clientUri
  issuerLocaleBrandingEntity.tosUri = isEmptyString(args.tosUri) ? undefined : args.tosUri
  issuerLocaleBrandingEntity.policyUri = isEmptyString(args.policyUri) ? undefined : args.policyUri
  issuerLocaleBrandingEntity.contacts = args.contacts

  return issuerLocaleBrandingEntity
}
