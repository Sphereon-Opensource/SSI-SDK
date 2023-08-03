import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
} from 'typeorm'
import { ImageAttributesEntity } from './ImageAttributesEntity'
import { BackgroundAttributesEntity } from './BackgroundAttributesEntity'
import { TextAttributesEntity } from './TextAttributesEntity'
import { validate, Validate, ValidationError } from 'class-validator'
import { IsNonEmptyStringConstraint } from '../validators'

@Entity('BaseLocaleBranding')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class BaseLocaleBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'alias', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank aliases are not allowed' })
  alias?: string

  @Column({ name: 'locale', length: 255, nullable: false, unique: false })
  locale?: string

  @OneToOne(() => ImageAttributesEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'logoId' })
  logo?: ImageAttributesEntity

  @Column({ name: 'description', length: 255, nullable: true, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Blank descriptions are not allowed' })
  description?: string

  @OneToOne(() => BackgroundAttributesEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'backgroundId' })
  background?: BackgroundAttributesEntity

  @OneToOne(() => TextAttributesEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'textId' })
  text?: TextAttributesEntity

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

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
