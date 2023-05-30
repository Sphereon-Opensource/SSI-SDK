import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ArrayMinSize, validate, ValidationError } from 'class-validator'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from './IssuerLocaleBrandingEntity'
import { IBasicIssuerBranding, IBasicLocaleBranding } from '../../types'

@Entity('IssuerBranding')
@Index('correlationId', ['issuerCorrelationId'])
export class IssuerBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'issuerCorrelationId', length: 255, nullable: false, unique: true })
  issuerCorrelationId!: string

  @OneToMany(
    () => IssuerLocaleBrandingEntity,
    (issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity) => issuerLocaleBrandingEntity.issuerBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: false,
    }
  )
  @ArrayMinSize(1, { message: 'localeBranding cannot be empty' })
  localeBranding!: Array<IssuerLocaleBrandingEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }

  @BeforeInsert()
  @BeforeUpdate()
  async validate(): Promise<undefined> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(validation[0].constraints?.arrayMinSize))
    }
    return
  }
}

export const issuerBrandingEntityFrom = (args: IBasicIssuerBranding): IssuerBrandingEntity => {
  const issuerBrandingEntity: IssuerBrandingEntity = new IssuerBrandingEntity()
  issuerBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  issuerBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicLocaleBranding) =>
    issuerLocaleBrandingEntityFrom(localeBranding)
  )

  return issuerBrandingEntity
}
