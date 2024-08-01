import { ChildEntity, Column } from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column('varchar', { name: 'identifier', length: 255, nullable: false })
  identifier!: string

  @Column('varchar', { name: 'redirect_url', length: 255, nullable: false })
  redirectUrl!: string

  @Column('varchar', { name: 'session_id', length: 255, nullable: false })
  sessionId!: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string
}
