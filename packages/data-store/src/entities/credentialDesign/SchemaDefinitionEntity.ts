import { BaseEntity, Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MetadataSetEntity } from './MetadataSetEntity'
import { FormStepEntity } from './FormStepEntity'

@Entity('schema_definition')
export class SchemaDefinitionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @Column('varchar', { name: 'extends_id', nullable: true })
  extendsId?: string

  @Column('text', { name: 'correlation_id', nullable: true })
  correlationId?: string

  @Column('text', { name: 'schema_type', nullable: true })
  schemaType?: string

  @Column('text', { name: 'entity_type', nullable: true })
  entityType?: string

  @Column('text', { name: 'schema', nullable: false })
  schema!: string

  @ManyToOne(() => MetadataSetEntity, (set: MetadataSetEntity) => set.schemaDefinitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meta_data_set_id' })
  metadataSet!: MetadataSetEntity

  @ManyToMany(() => FormStepEntity, (formStep: FormStepEntity) => formStep.schemaDefinitions)
  formSteps!: Array<FormStepEntity>
}
