import {
  Column,
  ChildEntity
} from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { IBasicOpenIdConfig } from '@sphereon/ssi-sdk-core'

@ChildEntity('OpenIdConfig')
export class OpenIdConfigEntity extends BaseConfigEntity {
  @Column('text', { name: 'client_id', nullable: false })
  clientId!: string

  @Column('text', { name: 'client_secret', nullable: false })
  clientSecret!: string

  @Column('text', { nullable: false })
  scopes!: Array<string>

  @Column('text', { nullable: false })
  issuer!: string

  @Column('text', { name: 'redirect_url', nullable: false })
  redirectUrl!: string

  @Column('boolean', { name: 'dangerously_allow_insecure_http_requests', nullable: false })
  dangerouslyAllowInsecureHttpRequests!: boolean

  @Column('text', { name: 'client_auth_method', nullable: false })
  clientAuthMethod!: 'basic' | 'post' | undefined
}

export const openIdConfigEntityFrom = (config: IBasicOpenIdConfig): OpenIdConfigEntity => {
  const openIdConfig = new OpenIdConfigEntity()
  openIdConfig.clientId = config.clientId
  openIdConfig.clientSecret = config.clientSecret
  openIdConfig.scopes = config.scopes
  openIdConfig.issuer = config.issuer
  openIdConfig.redirectUrl = config.redirectUrl
  openIdConfig.dangerouslyAllowInsecureHttpRequests = config.dangerouslyAllowInsecureHttpRequests
  openIdConfig.clientAuthMethod = config.clientAuthMethod

  return openIdConfig
}
