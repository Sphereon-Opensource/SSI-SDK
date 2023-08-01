import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { IBasicContact, IBasicIdentity } from '../../types'
import { IdentityEntity, identityEntityFrom } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'

@Entity('Contact')
export class ContactEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank names are not allowed' })
  name!: string

  @Column({ name: 'alias', type: 'varchar', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank aliases are not allowed' })
  alias!: string

  @Column({ name: 'uri', type: 'varchar', length: 255 })
  uri?: string

  @OneToMany(() => IdentityEntity, (identity: IdentityEntity) => identity.contact, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
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

export const contactEntityFrom = (args: IBasicContact): ContactEntity => {
  const contactEntity = new ContactEntity()
  contactEntity.name = args.name
  contactEntity.alias = args.alias
  contactEntity.uri = args.uri
  contactEntity.identities = args.identities ? args.identities.map((identity: IBasicIdentity) => identityEntityFrom(identity)) : []

  return contactEntity
}
