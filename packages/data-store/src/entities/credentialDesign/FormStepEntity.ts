import { BaseEntity, Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { SchemaDefinitionEntity } from './SchemaDefinitionEntity'

@Entity('form_step')
@Index('formstep_unique_step', ['stepNr', 'formId', 'order'], { unique: true })
export class FormStepEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @Column('text', { name: 'form_id', nullable: true })
  formId?: string

  @Column('integer', { name: 'step_nr', nullable: true })
  stepNr?: number

  @Column('integer', { name: 'order', nullable: true })
  order?: number

  @ManyToMany(() => SchemaDefinitionEntity, (schema: SchemaDefinitionEntity) => schema.formSteps, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: 'form_step_to_schema_definition',
    joinColumn: { name: 'form_step_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'schema_definition_id', referencedColumnName: 'id' },
  })
  schemaDefinitions!: Array<SchemaDefinitionEntity>
}
