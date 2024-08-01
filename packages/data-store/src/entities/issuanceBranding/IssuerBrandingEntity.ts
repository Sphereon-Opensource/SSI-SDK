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
import { ArrayMinSize, IsNotEmpty, validate, ValidationError } from 'class-validator'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { IssuerLocaleBrandingEntity, issuerLocaleBrandingEntityFrom } from './IssuerLocaleBrandingEntity'
import { IBasicIssuerBranding, IBasicIssuerLocaleBranding } from '../../types'

@Entity('IssuerBranding')
@Index('IDX_IssuerBrandingEntity_issuerCorrelationId', ['issuerCorrelationId'])
export class IssuerBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'issuerCorrelationId', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank issuerCorrelationIds are not allowed' })
  issuerCorrelationId!: string

  @OneToMany(
    () => IssuerLocaleBrandingEntity,
    (issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity) => issuerLocaleBrandingEntity.issuerBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: false,
    },
  )
  @ArrayMinSize(1, { message: 'localeBranding cannot be empty' })
  localeBranding!: Array<IssuerLocaleBrandingEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false, type: typeOrmDateTime() })
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
      return Promise.reject(Error(Object.values(validation[0].constraints!)[0]))
    }
    return
  }
}

export const issuerBrandingEntityFrom = (args: IBasicIssuerBranding): IssuerBrandingEntity => {
  const issuerBrandingEntity: IssuerBrandingEntity = new IssuerBrandingEntity()
  issuerBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  issuerBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicIssuerLocaleBranding) =>
    issuerLocaleBrandingEntityFrom(localeBranding),
  )

  return issuerBrandingEntity
}
