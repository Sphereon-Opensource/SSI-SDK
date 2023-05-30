import { ChildEntity, Column, JoinColumn, OneToOne } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { BasicOpenIdConfig } from '../../types'
import { ConnectionEntity } from './ConnectionEntity'

@ChildEntity('OpenIdConfig')
export class OpenIdConfigEntity extends BaseConfigEntity {
  @Column({ name: 'client_id', length: 255, nullable: false })
  clientId!: string

  @Column({ name: 'client_secret', length: 255, nullable: false })
  clientSecret!: string

  @Column('simple-array', { name: 'scopes', nullable: false })
  scopes!: Array<string>

  @Column({ name: 'issuer', length: 255, nullable: false })
  issuer!: string

  @Column('text', { name: 'redirect_url', nullable: false })
  redirectUrl!: string

  @Column('boolean', { name: 'dangerously_allow_insecure_http_requests', nullable: false })
  dangerouslyAllowInsecureHttpRequests!: boolean

  @Column('text', { name: 'client_auth_method', nullable: false })
  clientAuthMethod!: 'basic' | 'post' | undefined

  @OneToOne(() => ConnectionEntity, (connection: ConnectionEntity) => connection.config, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connectionId' })
  connection?: ConnectionEntity
}

export const openIdConfigEntityFrom = (config: BasicOpenIdConfig): OpenIdConfigEntity => {
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
