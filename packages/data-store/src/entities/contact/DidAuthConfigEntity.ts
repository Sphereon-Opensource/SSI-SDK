import { ChildEntity, Column } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column({ name: 'identifier', length: 255, nullable: false })
  identifier!: string

  @Column({ name: 'redirect_url', length: 255, nullable: false })
  redirectUrl!: string

  @Column({ name: 'session_id', length: 255, nullable: false })
  sessionId!: string

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: string
}
