import { ConnectionType } from '@sphereon/ssi-sdk.data-store-types'
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import { BaseConfigEntity } from './BaseConfigEntity'
import { DidAuthConfigEntity } from './DidAuthConfigEntity'
import { IdentityEntity } from './IdentityEntity'
import { OpenIdConfigEntity } from './OpenIdConfigEntity'

@Entity('Connection')
export class ConnectionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: ConnectionType, nullable: false })
  type!: ConnectionType

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

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
