import { ChildEntity, Column, JoinColumn, OneToOne } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { BasicDidAuthConfig } from '../../types'
import { ConnectionEntity } from './ConnectionEntity'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column({ name: 'identifier', length: 255, nullable: false })
  identifier!: string

  @Column({ name: 'redirect_url', length: 255, nullable: false })
  redirectUrl!: string

  @Column({ name: 'session_id', length: 255, nullable: false })
  sessionId!: string

  // TODO can we move this to the base entity?
  @OneToOne(() => ConnectionEntity, (connection: ConnectionEntity) => connection.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connectionId' })
  connection?: ConnectionEntity
}

export const didAuthConfigEntityFrom = (config: BasicDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig: DidAuthConfigEntity = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier.did
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.sessionId

  return didAuthConfig
}
