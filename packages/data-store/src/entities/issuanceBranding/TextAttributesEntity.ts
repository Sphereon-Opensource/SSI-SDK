import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicTextAttributes } from '../../types'

@Entity('TextAttributes')
export class TextAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'color', length: 255, nullable: true, unique: false })
  color?: string
}

export const textAttributesEntityFrom = (args: IBasicTextAttributes): TextAttributesEntity => {
  const textAttributesEntity = new TextAttributesEntity()
  textAttributesEntity.color = args.color

  return textAttributesEntity
}
