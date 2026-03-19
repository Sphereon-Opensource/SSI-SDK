export { ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { ValueType } from '@sphereon/ssi-sdk.data-store-types'
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { MetadataSetEntity } from './MetadataSetEntity'
import { MetadataValueEntity } from './MetadataValueEntity'

@Entity('meta_data_keys')
export class MetadataKeyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'value_type', enum: ValueType, nullable: false })
  valueType!: ValueType

  @Column('text', { name: 'key', nullable: false })
  key!: string

  @ManyToOne(() => MetadataSetEntity, (set: MetadataSetEntity) => set.metadataKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'set_id' })
  set!: MetadataSetEntity

  @OneToMany(() => MetadataValueEntity, (value: MetadataValueEntity) => value.metadataKey, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  metadataValues!: Array<MetadataValueEntity>
}
