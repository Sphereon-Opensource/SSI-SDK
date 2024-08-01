import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm'
import { IMetadataEntity, ValidationConstraint } from '../../types'
import { IdentityEntity } from './IdentityEntity'
import { IsNotEmpty, validate, ValidationError } from 'class-validator'
import { getConstraint } from '../../utils/ValidatorUtils'

@Entity('IdentityMetadata')
export class IdentityMetadataItemEntity extends BaseEntity implements IMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('varchar', { name: 'label', length: 255, nullable: false })
  @IsNotEmpty({ message: 'Blank metadata labels are not allowed' })
  label!: string

  @Column('varchar', { name: 'valueType', nullable: false })
  @IsNotEmpty({ message: 'valueType must not be empty' })
  valueType!: string

  @Column('varchar', { name: 'stringValue', length: 255, nullable: true })
  stringValue?: string

  @Column('numeric', { name: 'numberValue', nullable: true })
  numberValue?: number

  @Column({ name: 'dateValue', nullable: true, type: typeOrmDateTime() })
  dateValue?: Date

  @Column('boolean', { name: 'boolValue', nullable: true })
  boolValue?: boolean

  @ManyToOne(() => IdentityEntity, (identity: IdentityEntity) => identity.metadata, { cascade: ['insert', 'update'], onDelete: 'CASCADE' })
  identity!: IdentityEntity

  @BeforeInsert()
  @BeforeUpdate()
  async validate(): Promise<void> {
    const validation: Array<ValidationError> = await validate(this)
    if (validation.length > 0) {
      const constraint: ValidationConstraint | undefined = getConstraint(validation[0])
      if (constraint) {
        const message: string = Object.values(constraint!)[0]
        return Promise.reject(Error(message))
      }
    }
  }
}
