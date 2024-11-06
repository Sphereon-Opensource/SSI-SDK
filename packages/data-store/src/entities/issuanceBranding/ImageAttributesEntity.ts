import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ImageDimensionsEntity } from './ImageDimensionsEntity'
import { validate, Validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'

@Entity('ImageAttributes')
export class ImageAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('text', { name: 'uri', nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image uri are not allowed' })
  uri?: string

  @Column('text', { name: 'dataUri', nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image data uri are not allowed' })
  dataUri?: string

  @Column('varchar', { name: 'mediaType', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank image types are not allowed' })
  mediaType?: string

  @Column('varchar', { name: 'alt', length: 255, nullable: true, unique: false })
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
