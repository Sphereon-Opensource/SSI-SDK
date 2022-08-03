import { BaseEntity, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm'

export enum BaseConfigType {
  OPENID = 'OpenIdConfig',
  DIDAUTH = 'DidAuthConfig',
}

@Entity('BaseConfigEntity')
@TableInheritance({ column: { type: 'simple-enum', enum: BaseConfigType, name: 'type' } })
export abstract class BaseConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date
}
