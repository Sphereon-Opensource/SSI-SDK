import { ChildEntity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { IBasicLocaleBranding } from '../../types'
import { backgroundAttributesEntityFrom } from './BackgroundAttributesEntity'
import { imageAttributesEntityFrom } from './ImageAttributesEntity'
import { IssuerBrandingEntity } from './IssuerBrandingEntity'
import { BaseLocaleBrandingEntity } from './BaseLocaleBrandingEntity'
import { textAttributesEntityFrom } from './TextAttributesEntity'

@ChildEntity('IssuerLocaleBranding')
@Index(['issuerBranding', 'locale'], { unique: true }) //, where: 'locale IS NOT NULL OR locale IS NULL'
//@Index(['issuerBranding', 'locale'], { unique: true, where: `"locale" IS NULL` })
export class IssuerLocaleBrandingEntity extends BaseLocaleBrandingEntity {
  @ManyToOne(() => IssuerBrandingEntity, (issuerBranding: IssuerBrandingEntity) => issuerBranding.localeBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issuerBrandingId' })
  issuerBranding!: IssuerBrandingEntity

  // TODO use a validator to check if the nullable combination already exists
  //   @BeforeInsert()
  //   @BeforeUpdate()
  //   validateUniqueCombination() {
  //     if (this.column1 === null) {
  //       const entitiesWithNullColumn1 = MyEntity.find({ column1: null, column2: this.column2 });
  //       if (entitiesWithNullColumn1.length > 0) {
  //         throw new Error('Combination of column1 and column2 must be unique.');
  //       }
  //     } else {
  //       const entityWithSameCombination = MyEntity.findOne({ column1: this.column1, column2: this.column2 });
  //       if (entityWithSameCombination && entityWithSameCombination.id !== this.id) {
  //         throw new Error('Combination of column1 and column2 must be unique.');
  //       }
  //     }
  //   }
  // }
}

export const issuerLocaleBrandingEntityFrom = (args: IBasicLocaleBranding): IssuerLocaleBrandingEntity => {
  const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = new IssuerLocaleBrandingEntity()
  issuerLocaleBrandingEntity.alias = args.alias
  issuerLocaleBrandingEntity.locale = args.locale
  issuerLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  issuerLocaleBrandingEntity.description = args.description
  issuerLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  issuerLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return issuerLocaleBrandingEntity
}
