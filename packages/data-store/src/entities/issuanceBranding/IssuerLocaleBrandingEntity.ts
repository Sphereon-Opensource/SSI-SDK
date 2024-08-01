import { ChildEntity, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
import { IBasicIssuerLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { IssuerBrandingEntity } from './IssuerBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'
import { isEmptyString } from '../validators'

@ChildEntity('IssuerLocaleBranding')
@Index('IDX_IssuerLocaleBrandingEntity_issuerBranding_locale', ['issuerBranding', 'locale'], { unique: true })
export class IssuerLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => IssuerBrandingEntity, (issuerBranding: IssuerBrandingEntity) => issuerBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issuerBrandingId' })
  issuerBranding!: IssuerBrandingEntity

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

  return issuerLocaleBrandingEntity
}
