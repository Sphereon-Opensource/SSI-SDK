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
  OneToMany, BeforeInsert, BeforeUpdate,
} from 'typeorm'
import { correlationIdentifierEntityFrom, CorrelationIdentifierEntity } from './CorrelationIdentifierEntity'
import { ConnectionEntity, connectionEntityFrom } from './ConnectionEntity'
import { BasicMetadataItem, IBasicIdentity } from '../../types/contact'
import { ContactEntity } from './ContactEntity'
import { IdentityMetadataItemEntity, metadataItemEntityFrom } from './IdentityMetadataItemEntity'

@Entity('Identity')
export class IdentityEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'alias', length: 255, nullable: false, unique: true })
  alias!: string

  @OneToOne(() => CorrelationIdentifierEntity, (identifier: CorrelationIdentifierEntity) => identifier.identity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false
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
    nullable: false
  })
  @JoinColumn({ name: 'metadataId' })
  metadata!: Array<IdentityMetadataItemEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @ManyToOne(() => ContactEntity, (contact: ContactEntity) => contact.identities, {
    // cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  contact!: ContactEntity

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate() {
    this.lastUpdatedAt = new Date()
  }
}

export const identityEntityFrom = (args: IBasicIdentity): IdentityEntity => {
  const identityEntity = new IdentityEntity()
  identityEntity.alias = args.alias
  identityEntity.identifier = correlationIdentifierEntityFrom(args.identifier)
  if (args.connection) {
    identityEntity.connection = connectionEntityFrom(args.connection)
  }
  identityEntity.metadata = args.metadata ? args.metadata.map((item: BasicMetadataItem) => metadataItemEntityFrom(item)) : []

  return identityEntity
}
