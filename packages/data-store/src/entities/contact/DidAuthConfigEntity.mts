import { ChildEntity, Column, JoinColumn, OneToOne } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity.mjs'
import { BasicDidAuthConfig } from '../../types/index.mjs'
import { ConnectionEntity } from './ConnectionEntity.mjs'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column({ name: 'identifier', type: 'varchar', length: 255, nullable: false })
  identifier!: string

  @Column({ name: 'redirect_url', type: 'varchar', length: 255, nullable: false })
  redirectUrl!: string

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: false })
  sessionId!: string

  @OneToOne(() => ConnectionEntity, (connection: ConnectionEntity) => connection.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connectionId' })
  connection?: ConnectionEntity
}

export const didAuthConfigEntityFrom = (config: BasicDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier.did
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.sessionId

  return didAuthConfig
}
