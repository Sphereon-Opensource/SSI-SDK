import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm'
import { BasicMetadataItem } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'

@Entity('IdentityMetadata')
export class IdentityMetadataItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'label', type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank metadata labels are not allowed' })
  label!: string

  @Column({ name: 'value', type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank metadata values are not allowed' })
  value!: string

  @ManyToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.metadata, { cascade: ['insert', 'update'], onDelete: 'CASCADE' })
  identity!: IdentityEntity

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(Object.values(validation[0].constraints!)[0]))
    }
    return
  }
}

export const metadataItemEntityFrom = (item: BasicMetadataItem): IdentityMetadataItemEntity => {
  const metadataItem = new IdentityMetadataItemEntity()
  metadataItem.label = item.label
  metadataItem.value = item.value

  return metadataItem
}
