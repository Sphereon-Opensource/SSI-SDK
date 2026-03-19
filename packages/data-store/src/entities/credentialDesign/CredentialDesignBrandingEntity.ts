import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ImageAttributesEntity } from '../issuanceBranding/ImageAttributesEntity'
import { MetadataSetEntity } from './MetadataSetEntity'

@Entity('credential_design_branding')
export class CredentialDesignBrandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('text', { name: 'text_color', nullable: true })
  textColor?: string

  @Column('text', { name: 'background_color', nullable: true })
  backgroundColor?: string

  @ManyToOne(() => ImageAttributesEntity, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'logo' })
  logo?: ImageAttributesEntity

  @ManyToOne(() => ImageAttributesEntity, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'background_image' })
  backgroundImage?: ImageAttributesEntity

  @OneToOne(() => MetadataSetEntity, (set: MetadataSetEntity) => set.credentialDesignBranding, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meta_data_set_id' })
  metadataSet!: MetadataSetEntity
}
