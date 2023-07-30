import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm'
import { BasicMetadataItem, IMetadataItem, ValidationConstraint } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('IdentityMetadata')
export class IdentityMetadataItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'label', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank metadata labels are not allowed' })
  label!: string

  @Column({ name: 'value', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank metadata values are not allowed' })
  value!: string

  @ManyToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.metadata, { cascade: ['insert', 'update'], onDelete: 'CASCADE' })
  identity!: IdentityEntity

  @BeforeInsert()
  @BeforeUpdate()
  async validate(): Promise<void> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      const constraint: ValidationConstraint | undefined = getConstraint(validation[0])
      if (constraint) {
        const message: string = Object.values(constraint!)[0]
        return Promise.reject(Error(message))
      }
    }
  }
}

export const metadataItemEntityFrom = (item: BasicMetadataItem): IdentityMetadataItemEntity => {
  const metadataItem: IdentityMetadataItemEntity = new IdentityMetadataItemEntity()
  metadataItem.label = item.label
  metadataItem.value = item.value

  return metadataItem
}

export const metadataItemFrom = (item: IdentityMetadataItemEntity): IMetadataItem => {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
  }
}
