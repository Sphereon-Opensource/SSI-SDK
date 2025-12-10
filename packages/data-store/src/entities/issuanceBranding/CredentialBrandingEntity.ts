import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { ArrayMinSize, IsNotEmpty, validate, ValidationError } from 'class-validator'
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
import { CredentialLocaleBrandingEntity, computeCredentialLocaleBrandingState } from './CredentialLocaleBrandingEntity'
import { computeCompactHash } from '../../utils/issuanceBranding/HashUtils'

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

  @Column('varchar', { name: 'state', length: 255, nullable: false })
  state!: string

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
  setState(): void {
    if (this.localeBranding && Array.isArray(this.localeBranding)) {
      this.state = this.computeState()
    }
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

  private computeState(): string {
    const localeStates: Array<{ locale: string; alias: string; id: string; state: string }> = (this.localeBranding ?? []).map(
      (localeBranding: CredentialLocaleBrandingEntity) => ({
        locale: localeBranding.locale ?? '',
        alias: localeBranding.alias ?? '',
        id: localeBranding.id ?? '',
        state: computeCredentialLocaleBrandingState(localeBranding),
      }),
    )

    localeStates.sort((first, second) => {
      const localeCompare: number = first.locale.localeCompare(second.locale)
      if (localeCompare !== 0) {
        return localeCompare
      }
      const aliasCompare: number = first.alias.localeCompare(second.alias)
      if (aliasCompare !== 0) {
        return aliasCompare
      }
      return first.id.localeCompare(second.id)
    })

    const payload = {
      issuerCorrelationId: this.issuerCorrelationId,
      vcHash: this.vcHash,
      localeBranding: localeStates.map((entry) => entry.state),
    }

    return computeCompactHash(JSON.stringify(payload))
  }
}
