import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne
} from 'typeorm'
import { ConnectionEntity } from './ConnectionEntity'
import { IConnectionMetadataItem } from '@sphereon/ssi-sdk-core'

@Entity('ConnectionMetadata')
export class MetadataItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('text', { nullable: false })
  label!: string

  @Column('text', { nullable: false })
  value!: string

  @ManyToOne(() => ConnectionEntity, connection => connection.metadata, {
    onDelete: 'CASCADE'
  })
  connection!: ConnectionEntity
}

export const metadataItemEntityFrom = (item: IConnectionMetadataItem): MetadataItemEntity => {
  const metadataItem = new MetadataItemEntity()
  metadataItem.label = item.label
  metadataItem.value = item.value

  return metadataItem
}
