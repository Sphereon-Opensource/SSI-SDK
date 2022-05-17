import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import {
  ConnectionIdentifierEntity,
  connectionIdentifierEntityFrom
} from './ConnectionIdentifierEntity'
import {
  MetadataItemEntity,
  metadataItemEntityFrom
} from './MetadataItemEntity'
import { PartyEntity } from './PartyEntity'
import {
  ConnectionConfig,
  ConnectionTypeEnum,
  IConnection,
  IConnectionMetadataItem,
  IDidAuthConfig,
  IOpenIdConfig
} from '@sphereon/ssi-sdk-core'
import { openIdConfigEntityFrom } from './OpenIdConfigEntity'
import { didAuthConfigEntityFrom } from './DidAuthConfigEntity'

@Entity('Connection')
export class ConnectionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum',{ nullable: false })
  type!: ConnectionTypeEnum

  @OneToOne((type: ConnectionIdentifierEntity) => ConnectionIdentifierEntity, { cascade: true })
  @JoinColumn()
  identifier!: ConnectionIdentifierEntity

  @OneToOne((type: BaseConfigEntity) => BaseConfigEntity, { cascade: true })
  @JoinColumn()
  config!: BaseConfigEntity

  @OneToMany(() => MetadataItemEntity, (metadata: MetadataItemEntity) => metadata.connection, { cascade: true })
  @JoinColumn()
  metadata!: Array<MetadataItemEntity>;

  @ManyToOne(() => PartyEntity, party => party.connections, {
    onDelete: 'CASCADE'
  })
  party!: PartyEntity

  @CreateDateColumn({ type: 'datetime', name: 'created_at', nullable: false  })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date
}

export const connectionEntityFrom = (connection: Omit<IConnection, 'id' | 'createdAt' | 'lastUpdatedAt' | 'config.id' | 'identifier.id'>): ConnectionEntity => {
  const connectionEntity = new ConnectionEntity()
  connectionEntity.type = connection.type
  connectionEntity.identifier = connectionIdentifierEntityFrom(connection.identifier)
  connectionEntity.config = configEntityFrom(connection.type, connection.config)
  connectionEntity.metadata = connection.metadata ? connection.metadata.map((item: IConnectionMetadataItem) => metadataItemEntityFrom(item)) : []

  return connectionEntity
}

const configEntityFrom = (type: ConnectionTypeEnum, config: ConnectionConfig): BaseConfigEntity => {
  switch(type) {
    case ConnectionTypeEnum.OPENID:
      return openIdConfigEntityFrom(config as IOpenIdConfig)
    case ConnectionTypeEnum.DIDAUTH:
      return didAuthConfigEntityFrom(config as IDidAuthConfig)
    default:
      throw new Error('Connection type not supported')
  }
}
