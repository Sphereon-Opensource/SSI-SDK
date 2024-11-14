import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { CredentialLocaleBrandingEntity } from './CredentialLocaleBrandingEntity'
import { validate, Validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'

@Entity('CredentialClaims')
@Index('IDX_CredentialClaimsEntity_credentialLocaleBranding_locale', ['credentialLocaleBranding', 'key'], { unique: true })
export class CredentialClaimsEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'key', length: 255, nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank claim keys are not allowed' })
  key!: string

  @Column('varchar', { name: 'name', length: 255, nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank claim names are not allowed' })
  name!: string

  @ManyToOne(() => CredentialLocaleBrandingEntity, (credentialLocaleBranding: CredentialLocaleBrandingEntity) => credentialLocaleBranding.claims, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE'
  })
  credentialLocaleBranding!: CredentialLocaleBrandingEntity

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
