import { Entity, TableInheritance } from 'typeorm'
import { AbstractBaseEntity } from './AbstractBaseEntity'

@Entity('BaseConfigEntity')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class BaseConfigEntity extends AbstractBaseEntity {}
