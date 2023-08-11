import { ChildEntity, Column, Index, JoinColumn, ManyToOne } from 'typeorm'
import { IBasicIssuerLocaleBranding } from '../../types/index.mjs'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity.mjs'
import { imageAttributesEntityFrom } from './ImageAttributesEntity.mjs'
import { IssuerBrandingEntity } from './IssuerBrandingEntity.mjs'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity.mjs'
import { textAttributesEntityFrom } from './TextAttributesEntity.mjs'
import { isEmptyString } from '../validators/index.mjs'

@ChildEntity('IssuerLocaleBranding')
@Index('IDX_IssuerLocaleBrandingEntity_issuerBranding_locale', ['issuerBranding', 'locale'], { unique: true })
export class IssuerLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => IssuerBrandingEntity, (issuerBranding: IssuerBrandingEntity) => issuerBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issuerBrandingId' })
  issuerBranding!: IssuerBrandingEntity

  @Column({ name: 'issuerBrandingId', type: 'varchar', nullable: false })
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
