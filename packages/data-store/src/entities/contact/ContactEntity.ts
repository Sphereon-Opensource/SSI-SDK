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
import { IBasicContact, IBasicIdentity } from '../../types/contact'
import { IdentityEntity, identityEntityFrom } from './IdentityEntity'
import { IsNotEmpty, validate } from 'class-validator'

@Entity('Contact')
export class ContactEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'name', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank names are not allowed' })
  name!: string

  @Column({ name: 'alias', length: 255, nullable: false, unique: true })
  @IsNotEmpty({ message: 'Blank aliases are not allowed' })
  alias!: string

  @Column({ name: 'uri', length: 255 })
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
    const validation = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(validation[0].constraints?.isNotEmpty))
    }
    return
  }
}

export const contactEntityFrom = (args: IBasicContact): ContactEntity => {
  const contactEntity = new ContactEntity()
  contactEntity.name = args.name
  contactEntity.alias = args.alias
  contactEntity.uri = args.uri
  if (args.identities) {
    contactEntity.identities = args.identities.map((identity: IBasicIdentity) => identityEntityFrom(identity))
  }

  return contactEntity
}
