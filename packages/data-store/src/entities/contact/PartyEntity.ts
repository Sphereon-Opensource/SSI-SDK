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
import { IdentityEntity } from './IdentityEntity'
import { validate, ValidationError } from 'class-validator'
import { PartyTypeEntity } from './PartyTypeEntity'
import { BaseContactEntity } from './BaseContactEntity'
import { PartyRelationshipEntity } from './PartyRelationshipEntity'
import { getConstraint } from '../../utils/ValidatorUtils'
import { ElectronicAddressEntity } from './ElectronicAddressEntity'

@Entity('Party')
export class PartyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'uri', length: 255 })
  uri?: string

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

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  async checkUniqueTenantId(): Promise<undefined> {
    const result: Array<PartyEntity> = await PartyEntity.find({
      where: {
        partyType: {
          tenantId: this.partyType.tenantId,
        },
      },
    })

    if (result?.length > 0) {
      return Promise.reject(Error('Tenant id already in use'))
    }

    return
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
