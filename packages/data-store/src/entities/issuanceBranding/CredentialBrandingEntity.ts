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
import { ArrayMinSize, validate } from 'class-validator'
import { CredentialLocaleBrandingEntity, credentialLocaleBrandingEntityFrom } from './CredentialLocaleBrandingEntity'
import { IBasicCredentialBranding, IBasicLocaleBranding } from '../../types'

@Entity('CredentialBranding')
@Index('IDX_CredentialBrandingEntity_vcHash', ['vcHash'])
@Index('IDX_CredentialBrandingEntity_issuerCorrelationId', ['issuerCorrelationId'])
export class CredentialBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  //TODO make this the primary key?
  @Column({ name: 'vcHash', length: 255, nullable: false, unique: true })
  vcHash!: string

  // @PrimaryColumn({ name: 'vcHash', length: 255 })
  // vcHash!: string;

  @Column({ name: 'issuerCorrelationId', length: 255, nullable: false, unique: false })
  issuerCorrelationId!: string

  @OneToMany(
    () => CredentialLocaleBrandingEntity,
    (credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity) => credentialLocaleBrandingEntity.credentialBranding,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
      nullable: false,
    }
  )
  @ArrayMinSize(1, { message: 'localeBranding cannot be empty' })
  localeBranding!: Array<CredentialLocaleBrandingEntity>

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
    const validation = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(validation[0].constraints?.arrayMinSize))
    }
    return
  }
}

export const credentialBrandingEntityFrom = (args: IBasicCredentialBranding): CredentialBrandingEntity => {
  const credentialBrandingEntity: CredentialBrandingEntity = new CredentialBrandingEntity()
  credentialBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  credentialBrandingEntity.vcHash = args.vcHash
  credentialBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicLocaleBranding) =>
    credentialLocaleBrandingEntityFrom(localeBranding)
  )

  return credentialBrandingEntity
}
