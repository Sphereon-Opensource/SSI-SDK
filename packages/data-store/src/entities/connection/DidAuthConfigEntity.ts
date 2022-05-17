import {
  Column,
  ChildEntity
} from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { IDidAuthConfig } from '@sphereon/ssi-sdk-core'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column('text', { nullable: false })
  identifier!: string

  @Column('text', { name: 'redirect_url'})
  redirectUrl!: string

  @Column('text', { name: 'session_id', nullable: false })
  sessionId!: string
}

export const didAuthConfigEntityFrom = (config: IDidAuthConfig): DidAuthConfigEntity => {
  const didAuthConfig = new DidAuthConfigEntity()
  didAuthConfig.identifier = config.identifier
  didAuthConfig.redirectUrl = config.redirectUrl
  didAuthConfig.sessionId = config.redirectUrl + config.identifier

  return didAuthConfig
}
