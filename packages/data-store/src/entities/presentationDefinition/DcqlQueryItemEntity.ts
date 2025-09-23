import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { IsNotEmpty } from 'class-validator'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'

@Entity('DcqlQueryItem')
@Index(['version'], { unique: false })
export class DcqlQueryItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'query_id', length: 255, type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'A blank query id field is not allowed' })
  queryId!: string

  @Column({ name: 'version', length: 255, type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'A blank version field is not allowed' })
  version!: string

  @Column({ name: 'tenant_id', length: 255, type: 'varchar', nullable: true, unique: false })
  tenantId?: string

  @Column({ name: 'purpose', length: 255, type: 'varchar', nullable: true, unique: false })
  purpose?: string

  @Column({ name: 'name', length: 255, type: 'varchar', nullable: true, unique: false })
  name?: string

  @Column({ name: 'query', type: 'text', nullable: false, unique: false })
  @IsNotEmpty({ message: 'A blank dcql query payload field is not allowed' })
  query!: string

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
