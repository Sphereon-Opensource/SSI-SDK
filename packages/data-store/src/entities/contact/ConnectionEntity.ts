import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, BaseEntity } from 'typeorm'
import {
  BaseConfigEntity,
  configFrom, isDidAuthConfig, isOpenIdConfig
} from './BaseConfigEntity'
import {
  BasicConnectionConfig,
  BasicDidAuthConfig, BasicOpenIdConfig,
  ConnectionTypeEnum, IBasicConnection, IConnection
} from '../../types'
import { IdentityEntity } from './IdentityEntity'
import {
  OpenIdConfigEntity, openIdConfigEntityFrom
} from './OpenIdConfigEntity'
import {
  DidAuthConfigEntity, didAuthConfigEntityFrom
} from './DidAuthConfigEntity'

@Entity('Connection')
export class ConnectionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'type', enum: ConnectionTypeEnum, nullable: false })
  type!: ConnectionTypeEnum

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
  @JoinColumn({ name: 'identityId' })
  identity!: IdentityEntity
}

export const connectionEntityFrom = (connection: IBasicConnection): ConnectionEntity => {
  const connectionEntity: ConnectionEntity = new ConnectionEntity()
  connectionEntity.type = connection.type
  connectionEntity.config = configEntityFrom(connection.config)

  return connectionEntity
}

export const connectionFrom = (connection: ConnectionEntity): IConnection => {
  return {
    id: connection.id,
    type: connection.type,
    config: configFrom(connection.config),
  }
}

const configEntityFrom = (config: BasicConnectionConfig): BaseConfigEntity => {
  if (isOpenIdConfig(config)) {
    return openIdConfigEntityFrom(<BasicOpenIdConfig>config)
  } else if (isDidAuthConfig(config)) {
    return didAuthConfigEntityFrom(<BasicDidAuthConfig>config)
  }

  throw new Error('config type not supported')
}
