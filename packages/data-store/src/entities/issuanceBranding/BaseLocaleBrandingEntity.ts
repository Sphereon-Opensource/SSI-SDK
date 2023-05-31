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

@Entity('BaseLocaleBranding')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class BaseLocaleBrandingEntity extends BaseEntity {
  // TODO we need a better name since we now also introduced fieldLocaleBranding
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'alias', length: 255, nullable: true, unique: false })
  alias?: string // TODO still need a better name for this
  // TODO should now be not null since we get duplicates with null?
  // TODO blank validation?
  @Column({ name: 'locale', length: 255, nullable: true, unique: false })
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

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }
}
