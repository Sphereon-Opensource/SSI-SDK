import {
  BaseEntity,
  BeforeInsert, BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { BasicContact } from '../../types/contact'
import { IdentityEntity } from './IdentityEntity'

@Entity('Contact')
export class ContactEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'name', length: 255, nullable: false, unique: true })
  name!: string

  @Column({ name: 'alias', length: 255, nullable: false, unique: true })
  alias!: string

  @Column({ name: 'uri', length: 255 })
  uri?: string

  @OneToMany(() => IdentityEntity, (identity: IdentityEntity) => identity.contact, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false })
  @JoinColumn({ name: 'identityId' })
  identities!: Array<IdentityEntity>

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate() {
    this.lastUpdatedAt = new Date()
  }
}

export const contactEntityFrom = (args: BasicContact): ContactEntity => {
  const contactEntity = new ContactEntity()
  contactEntity.name = args.name
  contactEntity.alias = args.alias
  contactEntity.uri = args.uri

  return contactEntity
}
