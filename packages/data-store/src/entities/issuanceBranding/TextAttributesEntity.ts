import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicTextAttributes } from '../../types'
import { validate, Validate, ValidationError } from 'class-validator'
import { isEmptyString, IsNonEmptyStringConstraint } from '../validators'

@Entity('TextAttributes')
export class TextAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'color', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank text colors are not allowed' })
  color?: string

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

export const textAttributesEntityFrom = (args: IBasicTextAttributes): TextAttributesEntity => {
  const textAttributesEntity: TextAttributesEntity = new TextAttributesEntity()
  textAttributesEntity.color = isEmptyString(args.color) ? undefined : args.color

  return textAttributesEntity
}
