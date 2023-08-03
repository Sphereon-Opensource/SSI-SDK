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
import { correlationIdentifierEntityFrom, CorrelationIdentifierEntity, correlationIdentifierFrom } from './CorrelationIdentifierEntity'
import { ConnectionEntity, connectionEntityFrom, connectionFrom } from './ConnectionEntity'
import { IdentityMetadataItemEntity, metadataItemEntityFrom, metadataItemFrom } from './IdentityMetadataItemEntity'
import { BasicMetadataItem, IBasicIdentity, IdentityRoleEnum, IIdentity, ValidationConstraint } from '../../types'
import { ContactEntity } from './ContactEntity'
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

export const identityEntityFrom = (args: IBasicIdentity): IdentityEntity => {
  const identityEntity: IdentityEntity = new IdentityEntity()
  identityEntity.alias = args.alias
  identityEntity.roles = args.roles
  identityEntity.identifier = correlationIdentifierEntityFrom(args.identifier)
  identityEntity.connection = args.connection ? connectionEntityFrom(args.connection) : undefined
  identityEntity.metadata = args.metadata ? args.metadata.map((item: BasicMetadataItem) => metadataItemEntityFrom(item)) : []

  return identityEntity
}

export const identityFrom = (identity: IdentityEntity): IIdentity => {
  return {
    id: identity.id,
    alias: identity.alias,
    roles: identity.roles,
    identifier: correlationIdentifierFrom(identity.identifier),
    ...(identity.connection && { connection: connectionFrom(identity.connection) }),
    metadata: identity.metadata ? identity.metadata.map((item: IdentityMetadataItemEntity) => metadataItemFrom(item)) : [],
    createdAt: identity.createdAt,
    lastUpdatedAt: identity.createdAt,
  }
}
