import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PartyEntity } from './PartyEntity'
import { PartyOrigin, PartyTypeType, ValidationConstraint } from '../../types'
import { IsNotEmpty, Validate, validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('PartyType')
@Index('IDX_PartyType_type_tenant_id', ['type', 'tenantId'], { unique: true })
export class PartyTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: PartyTypeType, nullable: false, unique: false })
  type!: PartyTypeType

  @Column('simple-enum', { name: 'origin', enum: PartyOrigin, default: 'EXTERNAL', nullable: false, unique: false })
  origin!: PartyOrigin

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

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }

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
