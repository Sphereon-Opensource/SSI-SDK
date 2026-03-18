import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MetaDataKeyEntity } from './MetaDataKeyEntity'

@Entity('meta_data_values')
export class MetaDataValueEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('integer', { name: 'index', nullable: true })
  index?: number

  @Column('text', { name: 'text_value', nullable: true })
  textValue?: string

  @Column('numeric', { name: 'number_value', nullable: true })
  numberValue?: number

  @Column('boolean', { name: 'boolean_value', nullable: true })
  booleanValue?: boolean

  @Column({ name: 'timestamp_value', nullable: true, type: typeOrmDateTime() })
  timestampValue?: Date

  @ManyToOne(() => MetaDataKeyEntity, (key: MetaDataKeyEntity) => key.metaDataValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'key_id' })
  metaDataKey!: MetaDataKeyEntity
}
