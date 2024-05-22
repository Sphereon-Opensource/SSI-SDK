import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { IsNotEmpty } from 'class-validator'

@Entity('PresentationDefinitionItemEntity')
export class PresentationDefinitionItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'tenant_id', length: 255, nullable: true, unique: false })
  tenantId?: string

  @Column({ name: 'pd_id', length: 255, nullable: true, unique: false })
  @IsNotEmpty({ message: 'pdId field must not be empty' })
  pdId!: string

  @Column({ name: 'version', length: 255, nullable: false, unique: false })
  @IsNotEmpty({ message: 'version field must not be empty' })
  version!: string

  @Column({ name: 'purpose', length: 255, nullable: true, unique: false })
  purpose?: string

  @Column({ name: 'definition_payload', type: 'text', nullable: false, unique: false })
  @IsNotEmpty({ message: 'definitionPayload field must not be empty' })
  definitionPayload!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }
}
