import { IsNotEmpty, Validate, validate, ValidationError } from 'class-validator'
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { getConstraint } from '../../utils/ValidatorUtils'
import { PhysicalAddressType, ValidationConstraint } from '../../types'
import { PartyEntity } from './PartyEntity'
import { IsNonEmptyStringConstraint } from '../validators'

@Entity('PhysicalAddress')
export class PhysicalAddressEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'type', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank physical address types are not allowed' })
  type!: PhysicalAddressType

  @Column({ name: 'street_name', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank street names are not allowed' })
  streetName!: string

  @Column({ name: 'street_number', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank street numbers are not allowed' })
  streetNumber!: string

  @Column({ name: 'postal_code', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank postal codes are not allowed' })
  postalCode!: string

  @Column({ name: 'city_name', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank city names are not allowed' })
  cityName!: string

  @Column({ name: 'province_name', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank province names are not allowed' })
  provinceName!: string

  @Column({ name: 'country_code', length: 2, nullable: false })
  @IsNotEmpty({ message: 'Blank country codes are not allowed' })
  countryCode!: string

  @Column({ name: 'building_name', length: 255, nullable: true })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank building names are not allowed' })
  buildingName?: string

  @Column({name: 'owner_id', nullable: true})
  ownerId?: string

  @Column({name: 'tenant_id', nullable: true})
  tenantId?: string

  @ManyToOne(() => PartyEntity, (party: PartyEntity) => party.physicalAddresses, {
    onDelete: 'CASCADE',
  })
  party!: PartyEntity

  @Column({ name: 'partyId', nullable: true })
  partyId?: string

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
