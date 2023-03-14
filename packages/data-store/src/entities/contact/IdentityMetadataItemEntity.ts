import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from 'typeorm'
import { BasicMetadataItem } from '../../types/contact'
import { IdentityEntity } from './IdentityEntity'

@Entity('IdentityMetadata')
export class IdentityMetadataItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'label', length: 255, nullable: false })
  label!: string

  @Column({ name: 'value', length: 255, nullable: false })
  value!: string

  @ManyToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.metadata, { cascade: ['insert', 'update'], onDelete: 'CASCADE' })
  identity!: IdentityEntity
}

export const metadataItemEntityFrom = (item: BasicMetadataItem): IdentityMetadataItemEntity => {
  const metadataItem = new IdentityMetadataItemEntity()
  metadataItem.label = item.label
  metadataItem.value = item.value

  return metadataItem
}
