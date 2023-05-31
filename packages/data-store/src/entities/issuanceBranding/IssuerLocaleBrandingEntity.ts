import {
  ChildEntity,
  Column,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm'
import { IBasicIssuerLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { IssuerBrandingEntity } from './IssuerBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'

@ChildEntity('IssuerLocaleBranding')
@Index('IDX_IssuerLocaleBrandingEntity_issuerBranding_locale', ['issuerBranding', 'locale'], { unique: true })
export class IssuerLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => IssuerBrandingEntity, (issuerBranding: IssuerBrandingEntity) => issuerBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issuerBrandingId' })
  issuerBranding!: IssuerBrandingEntity

  @Column({ name: 'issuerBrandingId', nullable: false })
  issuerBrandingId!: string
}

export const issuerLocaleBrandingEntityFrom = (args: IBasicIssuerLocaleBranding): IssuerLocaleBrandingEntity => {
  const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = new IssuerLocaleBrandingEntity()
  issuerLocaleBrandingEntity.alias = args.alias
  issuerLocaleBrandingEntity.locale = args.locale
  issuerLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  issuerLocaleBrandingEntity.description = args.description
  issuerLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  issuerLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return issuerLocaleBrandingEntity
}
