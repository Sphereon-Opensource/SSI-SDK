import { BaseEntity, Entity, PrimaryGeneratedColumn, TableInheritance } from 'typeorm'

@Entity('BaseConfigEntity') // FIXME rename it to 'BaseConfig'
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseConfigEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string
}
