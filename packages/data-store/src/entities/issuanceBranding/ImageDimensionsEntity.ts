import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('ImageDimensions')
export class ImageDimensionsEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('integer', { name: 'width', nullable: false, unique: false })
  width!: number

  @Column('integer', { name: 'height', nullable: false, unique: false })
  height!: number
}
