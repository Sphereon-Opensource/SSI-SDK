import { Column, ChildEntity } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { IBasicDidAuthConfig } from '@sphereon/ssi-sdk-core'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column('text', { nullable: false })
  identifier!: string

  @Column('text', { name: 'redirect_url' })
  redirectUrl!: string

  @Column('text', { name: 'session_id', nullable: false })
  sessionId!: string
}

export const didAuthConfigEntityFrom = (config: IBasicDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier.did
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.redirectUrl + config.identifier

  return didAuthConfig
}
