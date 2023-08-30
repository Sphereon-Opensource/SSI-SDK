import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm'
import { PartyEntity } from './PartyEntity'
import { PartyTypeEnum, ValidationConstraint } from '../../types'
import { IsNotEmpty, Validate, validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('PartyType')
@Index('IDX_PartyTypeEntity_type_tenantId', ['type', 'tenantId'], { unique: true }) // TODO use name for migrations
export class PartyTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: PartyTypeEnum, nullable: false, unique: false })
  type!: PartyTypeEnum

  @Column({ name: 'name', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank names are not allowed' })
  name!: string

  @Column({ name: 'description', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank descriptions are not allowed' })
  description?: string

  @Column({ name: 'tenant_id', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: "Blank tenant id's are not allowed" })
  tenantId!: string

  @OneToMany(() => PartyEntity, (party: PartyEntity) => party.partyType, {
    nullable: false,
  })
  parties!: Array<PartyEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  async validate(): Promise<void> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      const constraint: ValidationConstraint | undefined = getConstraint(validation[0])
      if (constraint) {
        const message: string = Object.values(constraint!)[0]
        return Promise.reject(Error(message))
      }
    }
  }
}
