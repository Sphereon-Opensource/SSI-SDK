import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { PartyEntity } from './PartyEntity'
import { getConstraint } from '../../utils/ValidatorUtils'
import { ElectronicAddressType, ValidationConstraint } from '../../types'

@Entity('ElectronicAddress')
export class ElectronicAddressEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'type', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank electronic address types are not allowed' })
  type!: ElectronicAddressType

  @Column('varchar', { name: 'electronic_address', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank electronic addresses are not allowed' })
  electronicAddress!: string

  @ManyToOne(() => PartyEntity, (party: PartyEntity) => party.electronicAddresses, {
    onDelete: 'CASCADE',
  })
  party!: PartyEntity

  @Column('text', { name: 'partyId', nullable: true })
  partyId?: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

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
