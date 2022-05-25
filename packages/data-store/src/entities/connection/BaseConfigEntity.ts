import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn
} from 'typeorm'

@Entity('BaseConfigEntity')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class BaseConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ type: 'datetime', name: 'created_at', nullable: false  })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date
}
