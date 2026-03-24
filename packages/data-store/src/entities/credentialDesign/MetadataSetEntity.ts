import { BaseEntity, Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MetadataKeyEntity } from './MetadataKeyEntity'
import { SchemaDefinitionEntity } from './SchemaDefinitionEntity'
import { CredentialDesignBrandingEntity } from './CredentialDesignBrandingEntity'

@Entity('meta_data_set')
@Index('meta_data_set_unique_tenant', ['name', 'tenantId'], { unique: true })
export class MetadataSetEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @Column('text', { name: 'name', nullable: false })
  name!: string

  @OneToMany(() => MetadataKeyEntity, (key: MetadataKeyEntity) => key.set, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  metadataKeys!: Array<MetadataKeyEntity>

  @OneToMany(() => SchemaDefinitionEntity, (schema: SchemaDefinitionEntity) => schema.metadataSet, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  schemaDefinitions!: Array<SchemaDefinitionEntity>

  @OneToOne(() => CredentialDesignBrandingEntity, (branding: CredentialDesignBrandingEntity) => branding.metadataSet, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  credentialDesignBranding?: CredentialDesignBrandingEntity
}
