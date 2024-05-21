import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { CorrelationIdentifierEntity } from './CorrelationIdentifierEntity'
import { ConnectionEntity } from './ConnectionEntity'
import { IdentityMetadataItemEntity } from './IdentityMetadataItemEntity'
import { IdentityRole, ValidationConstraint } from '../../types'
import { PartyEntity } from './PartyEntity'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('Identity')
export class IdentityEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    name: 'alias',
    length: 255,
    nullable: false,
    unique: true,
  })
  @IsNotEmpty({ message: 'Blank aliases are not allowed' })
  alias!: string

  @Column('simple-array', { name: 'roles', nullable: false })
  roles!: Array<IdentityRole>

  @OneToOne(() => CorrelationIdentifierEntity, (identifier: CorrelationIdentifierEntity) => identifier.identity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  identifier!: CorrelationIdentifierEntity

  @OneToOne(() => ConnectionEntity, (connection: ConnectionEntity) => connection.identity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  connection?: ConnectionEntity

  @OneToMany(() => IdentityMetadataItemEntity, (metadata: IdentityMetadataItemEntity) => metadata.identity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'metadata_id' }) // TODO check in db file
  metadata!: Array<IdentityMetadataItemEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @ManyToOne(() => PartyEntity, (party: PartyEntity) => party.identities, {
    onDelete: 'CASCADE',
  })
  party!: PartyEntity

  @Column({ name: 'partyId', nullable: true })
  partyId?: string

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
