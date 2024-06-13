import { ChildEntity, Column } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'

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

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: string
}
