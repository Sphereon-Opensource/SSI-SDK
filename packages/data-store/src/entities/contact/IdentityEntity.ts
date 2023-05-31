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
import { correlationIdentifierEntityFrom, CorrelationIdentifierEntity } from './CorrelationIdentifierEntity'
import { ConnectionEntity, connectionEntityFrom } from './ConnectionEntity'
import { IdentityMetadataItemEntity, metadataItemEntityFrom } from './IdentityMetadataItemEntity'
import { BasicMetadataItem, IBasicIdentity, IdentityRoleEnum } from '../../types'
import { ContactEntity } from './ContactEntity'

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
  roles!: Array<IdentityRoleEnum>

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
  @JoinColumn({ name: 'metadataId' })
  metadata!: Array<IdentityMetadataItemEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @ManyToOne(() => ContactEntity, (contact: ContactEntity) => contact.identities, {
    onDelete: 'CASCADE',
  })
  contact!: ContactEntity

  @Column({ name: 'contactId', nullable: true })
  contactId!: string

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate() {
    this.lastUpdatedAt = new Date()
  }

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(Object.values(validation[0].constraints!)[0]))
    }
    return
  }
}

export const identityEntityFrom = (args: IBasicIdentity): IdentityEntity => {
  const identityEntity = new IdentityEntity()
  identityEntity.alias = args.alias
  identityEntity.roles = args.roles
  identityEntity.identifier = correlationIdentifierEntityFrom(args.identifier)
  identityEntity.connection = args.connection ? connectionEntityFrom(args.connection) : undefined
  identityEntity.metadata = args.metadata ? args.metadata.map((item: BasicMetadataItem) => metadataItemEntityFrom(item)) : []

  return identityEntity
}
