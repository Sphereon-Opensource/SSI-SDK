import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ValidationConstraint } from '../../types'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { IdentityEntity } from './IdentityEntity'
import { validate, ValidationError } from 'class-validator'
import { PartyTypeEntity } from './PartyTypeEntity'
import { BaseContactEntity } from './BaseContactEntity'
import { PartyRelationshipEntity } from './PartyRelationshipEntity'
import { getConstraint } from '../../utils/ValidatorUtils'
import { ElectronicAddressEntity } from './ElectronicAddressEntity'
import { PhysicalAddressEntity } from './PhysicalAddressEntity'

@Entity('Party')
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'uri', length: 255, nullable: true })
  uri?: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @OneToMany(() => IdentityEntity, (identity: IdentityEntity) => identity.party, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'identity_id' })
  identities!: Array<IdentityEntity>

  @OneToMany(() => ElectronicAddressEntity, (electronicAddress: ElectronicAddressEntity) => electronicAddress.party, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'electronic_address_id' })
  electronicAddresses!: Array<ElectronicAddressEntity>

  @OneToMany(() => PhysicalAddressEntity, (physicalAddress: PhysicalAddressEntity) => physicalAddress.party, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'physical_address_id' })
  physicalAddresses!: Array<PhysicalAddressEntity>

  @ManyToOne(() => PartyTypeEntity, (contactType: PartyTypeEntity) => contactType.parties, {
    cascade: true,
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'party_type_id' })
  partyType!: PartyTypeEntity

  @OneToOne(() => BaseContactEntity, (contact: BaseContactEntity) => contact.party, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  contact!: BaseContactEntity

  @OneToMany(() => PartyRelationshipEntity, (relationship: PartyRelationshipEntity) => relationship.left, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'relationship_id' })
  relationships!: Array<PartyRelationshipEntity>

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
