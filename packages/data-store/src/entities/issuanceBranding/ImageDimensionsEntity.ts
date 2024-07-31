import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicImageDimensions } from '../../types'

@Entity('ImageDimensions')
export class ImageDimensionsEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('integer', { name: 'width', nullable: false, unique: false })
  width!: number

  @Column('integer', { name: 'height', nullable: false, unique: false })
  height!: number
}

export const imageDimensionsEntityFrom = (args: IBasicImageDimensions): ImageDimensionsEntity => {
  const imageDimensionsEntity: ImageDimensionsEntity = new ImageDimensionsEntity()
  imageDimensionsEntity.width = args.width
  imageDimensionsEntity.height = args.height

  return imageDimensionsEntity
}
