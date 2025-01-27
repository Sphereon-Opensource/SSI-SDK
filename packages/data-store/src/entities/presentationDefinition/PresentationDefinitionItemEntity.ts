import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { IsNotEmpty } from 'class-validator'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'

@Entity('PresentationDefinitionItem')
@Index(['version'], { unique: false })
export class PresentationDefinitionItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'definition_id', length: 255, type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'A blank definition id field is not allowed' })
  definitionId!: string

  @Column({ name: 'version', length: 255, type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'A blank version field is not allowed' })
  version!: string

  @Column({ name: 'tenant_id', length: 255, type: 'varchar', nullable: true, unique: false })
  tenantId?: string

  @Column({ name: 'purpose', length: 255, type: 'varchar', nullable: true, unique: false })
  purpose?: string

  @Column({ name: 'name', length: 255, type: 'varchar', nullable: true, unique: false })
  name?: string

  @Column({ name: 'definition_payload', type: 'text', nullable: false, unique: false }) // TODO should this become nullable now we have dcqlPayload?
  @IsNotEmpty({ message: 'A blank PD definition payload field is not allowed' })
  definitionPayload!: string

  @Column({ name: 'dcql_payload', type: 'text', nullable: true, unique: false })
  @IsNotEmpty({ message: 'A blank dcql definition payload field is not allowed' })
  dcqlPayload!: string

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false, type: typeOrmDateTime() })
  lastUpdatedAt!: Date

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }
}
