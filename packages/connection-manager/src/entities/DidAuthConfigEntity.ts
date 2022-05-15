import {
  Column,
  ChildEntity
} from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'

@ChildEntity('DidAuthConfig')
export class DidAuthConfigEntity extends BaseConfigEntity {
  @Column('text', { nullable: false })
  identifier!: string

  @Column('text', { name: 'redirect_url'})
  redirectUrl!: string;

  @Column('text', { name: 'session_id', nullable: false })
  sessionId!: string;
}
