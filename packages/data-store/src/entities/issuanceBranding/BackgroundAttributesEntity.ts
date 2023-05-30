import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { IBasicBackgroundAttributes } from '../../types'
import { ImageAttributesEntity, imageAttributesEntityFrom } from './ImageAttributesEntity'

@Entity('BackgroundAttributes')
export class BackgroundAttributesEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'color', length: 255, nullable: true, unique: false })
  color?: string

  @OneToOne(() => ImageAttributesEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'imageId' })
  image?: ImageAttributesEntity
}

export const backgroundAttributesEntityFrom = (args: IBasicBackgroundAttributes): BackgroundAttributesEntity => {
  const backgroundAttributesEntity: BackgroundAttributesEntity = new BackgroundAttributesEntity()
  backgroundAttributesEntity.color = args.color
  backgroundAttributesEntity.image = args.image ? imageAttributesEntityFrom(args.image) : undefined

  return backgroundAttributesEntity
}
