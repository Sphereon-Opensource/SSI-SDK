import { BaseEntity, Entity, PrimaryGeneratedColumn, TableInheritance } from 'typeorm'

@Entity('BaseConfigEntity')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string
}
