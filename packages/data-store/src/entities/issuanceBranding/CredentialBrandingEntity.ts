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
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from './CredentialLocaleBrandingEntity'
import { IBasicCredentialBranding, IBasicCredentialLocaleBranding } from '../../types'

@Entity('CredentialBranding')
@Index('IDX_CredentialBrandingEntity_vcHash', ['vcHash'])
@Index('IDX_CredentialBrandingEntity_issuerCorrelationId', ['issuerCorrelationId'])
export class CredentialBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'vcHash', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank vcHashes are not allowed' })
  vcHash!: string

  @Column('varchar', { name: 'issuerCorrelationId', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'Blank issuerCorrelationIds are not allowed' })
  issuerCorrelationId!: string

  @OneToMany(
    () => CredentialLocaleBrandingEntity,
    (credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity) => credentialLocaleBrandingEntity.credentialBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: false,
    },
  )
  @ArrayMinSize(1, { message: 'localeBranding cannot be empty' })
  localeBranding!: Array<CredentialLocaleBrandingEntity>

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

export const credentialBrandingEntityFrom = (args: IBasicCredentialBranding): CredentialBrandingEntity => {
  const credentialBrandingEntity: CredentialBrandingEntity = new CredentialBrandingEntity()
  credentialBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  credentialBrandingEntity.vcHash = args.vcHash
  credentialBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicCredentialLocaleBranding) =>
    credentialLocaleBrandingEntityFrom(localeBranding),
  )

  return credentialBrandingEntity
}
