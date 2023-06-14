import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, BaseEntity } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { BasicConnectionConfig, ConnectionTypeEnum, IBasicConnection, IDidAuthConfig, IOpenIdConfig } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { OpenIdConfigEntity, openIdConfigEntityFrom } from './OpenIdConfigEntity'
import { DidAuthConfigEntity, didAuthConfigEntityFrom } from './DidAuthConfigEntity'

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
  const connectionEntity = new ConnectionEntity()
  connectionEntity.type = connection.type
  connectionEntity.config = configEntityFrom(connection.type, connection.config)

  return connectionEntity
}

const configEntityFrom = (type: ConnectionTypeEnum, config: BasicConnectionConfig): BaseConfigEntity => {
  switch (type) {
    case ConnectionTypeEnum.OPENID_CONNECT:
      return openIdConfigEntityFrom(config as IOpenIdConfig)
    case ConnectionTypeEnum.SIOPv2:
      return didAuthConfigEntityFrom(config as IDidAuthConfig)
    default:
      throw new Error('Connection type not supported')
  }
}
