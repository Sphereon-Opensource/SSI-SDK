import { ChildEntity, Column } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { IBasicDidAuthConfig } from '../../types/connections'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column('text', { name: 'identifier', nullable: false })
  identifier!: string

  @Column('text', { name: 'redirect_url' })
  redirectUrl!: string

  @Column({ name: 'session_id', length: 255, nullable: false })
  sessionId!: string
}

export const didAuthConfigEntityFrom = (config: IBasicDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier.did
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.redirectUrl + config.identifier

  return didAuthConfig
}
