import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicImageAttributes } from '../../types'
import { ImageDimensionsEntity, imageDimensionsEntityFrom } from './ImageDimensionsEntity'

@Entity('ImageAttributes')
export class ImageAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'uri', length: 255, nullable: true, unique: false })
  uri?: string

  @Column({ name: 'base64Content ', length: 255, nullable: true, unique: false })
  base64Content?: string

  @Column({ name: 'type', length: 255, nullable: true, unique: false })
  type?: string

  @Column({ name: 'alt', length: 255, nullable: true, unique: false })
  alt?: string

  @OneToOne(() => ImageDimensionsEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'dimensionsId' })
  dimensions?: ImageDimensionsEntity
}

export const imageAttributesEntityFrom = (args: IBasicImageAttributes): ImageAttributesEntity => {
  const imageAttributesEntity: ImageAttributesEntity = new ImageAttributesEntity()
  imageAttributesEntity.uri = args.uri
  imageAttributesEntity.base64Content = args.base64Content
  imageAttributesEntity.type = args.type
  imageAttributesEntity.alt = args.alt
  imageAttributesEntity.dimensions = args.dimensions ? imageDimensionsEntityFrom(args.dimensions) : undefined

  return imageAttributesEntity
}
