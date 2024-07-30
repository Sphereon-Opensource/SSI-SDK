import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicBackgroundAttributes } from '../../types'
import { ImageAttributesEntity, imageAttributesEntityFrom } from './ImageAttributesEntity'
import { validate, Validate, ValidationError } from 'class-validator'
import { isEmptyString, IsNonEmptyStringConstraint } from '../validators'

@Entity('BackgroundAttributes')
export class BackgroundAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'color', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank background colors are not allowed' })
  color?: string

  @OneToOne(() => ImageAttributesEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'imageId' })
  image?: ImageAttributesEntity

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

export const backgroundAttributesEntityFrom = (args: IBasicBackgroundAttributes): BackgroundAttributesEntity => {
  const backgroundAttributesEntity: BackgroundAttributesEntity = new BackgroundAttributesEntity()
  backgroundAttributesEntity.color = isEmptyString(args.color) ? undefined : args.color
  backgroundAttributesEntity.image = args.image ? imageAttributesEntityFrom(args.image) : undefined

  return backgroundAttributesEntity
}
