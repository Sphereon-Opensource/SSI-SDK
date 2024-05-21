import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, BaseEntity } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { ConnectionType } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { OpenIdConfigEntity } from './OpenIdConfigEntity'
import { DidAuthConfigEntity } from './DidAuthConfigEntity'

@Entity('Connection')
export class ConnectionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: ConnectionType, nullable: false })
  type!: ConnectionType

  @OneToOne(() => BaseConfigEntity, (config: OpenIdConfigEntity | DidAuthConfigEntity) => config.connection, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: false,
  })
  config!: BaseConfigEntity

  @OneToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.connection, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'identity_id' })
  identity!: IdentityEntity
}
