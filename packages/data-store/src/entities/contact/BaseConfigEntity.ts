import { BaseEntity, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm'
import { ConnectionEntity } from './ConnectionEntity'

@Entity('BaseConfig')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => ConnectionEntity, (connection: ConnectionEntity) => connection.config, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connection_id' })
  connection?: ConnectionEntity
}
