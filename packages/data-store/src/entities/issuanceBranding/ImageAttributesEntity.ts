import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicImageAttributes } from '../../types'
import { ImageDimensionsEntity, imageDimensionsEntityFrom } from './ImageDimensionsEntity'
import { validate, Validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'

@Entity('ImageAttributes')
export class ImageAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'uri', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image uri are not allowed' })
  uri?: string

  @Column({ name: 'base64Content ', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image base64 content are not allowed' })
  base64Content?: string

  @Column({ name: 'mediaType', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image types are not allowed' })
  mediaType?: string

  @Column({ name: 'alt', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image alts are not allowed' })
  alt?: string

  @OneToOne(() => ImageDimensionsEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'dimensionsId' })
  dimensions?: ImageDimensionsEntity

  @BeforeInsert()
  @BeforeUpdate()
  async validate(): Promise<undefined> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      return Promise.reject(Error(Object.values(validation[0].constraints!)[0]))
    }
    return
  }
}

export const imageAttributesEntityFrom = (args: IBasicImageAttributes): ImageAttributesEntity => {
  const imageAttributesEntity: ImageAttributesEntity = new ImageAttributesEntity()
  imageAttributesEntity.uri = args.uri
  imageAttributesEntity.base64Content = args.base64Content
  imageAttributesEntity.mediaType = args.mediaType
  imageAttributesEntity.alt = args.alt
  imageAttributesEntity.dimensions = args.dimensions ? imageDimensionsEntityFrom(args.dimensions) : undefined

  return imageAttributesEntity
}
