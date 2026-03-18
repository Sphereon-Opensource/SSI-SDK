export { ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { MetaDataSetEntity } from './MetaDataSetEntity'
import { MetaDataValueEntity } from './MetaDataValueEntity'

@Entity('meta_data_keys')
export class MetaDataKeyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'value_type', enum: ValueType, nullable: false })
  valueType!: ValueType

  @Column('text', { name: 'key', nullable: false })
  key!: string

  @ManyToOne(() => MetaDataSetEntity, (set: MetaDataSetEntity) => set.metaDataKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'set_id' })
  set!: MetaDataSetEntity

  @OneToMany(() => MetaDataValueEntity, (value: MetaDataValueEntity) => value.metaDataKey, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  metaDataValues!: Array<MetaDataValueEntity>
}
