import { BaseEntity, Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MetaDataKeyEntity } from './MetaDataKeyEntity'
import { SchemaDefinitionEntity } from './SchemaDefinitionEntity'
import { CredentialDesignBrandingEntity } from './CredentialDesignBrandingEntity'

@Entity('meta_data_set')
@Index('meta_data_set_unique_tenant', ['name', 'tenantId'], { unique: true })
export class MetaDataSetEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @Column('text', { name: 'name', nullable: false })
  name!: string

  @OneToMany(() => MetaDataKeyEntity, (key: MetaDataKeyEntity) => key.set, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  metaDataKeys!: Array<MetaDataKeyEntity>

  @OneToMany(() => SchemaDefinitionEntity, (schema: SchemaDefinitionEntity) => schema.metaDataSet, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  schemaDefinitions!: Array<SchemaDefinitionEntity>

  @OneToOne(() => CredentialDesignBrandingEntity, (branding: CredentialDesignBrandingEntity) => branding.metaDataSet, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  credentialDesignBranding?: CredentialDesignBrandingEntity
}
