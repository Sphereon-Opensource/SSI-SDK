import { Validate } from 'class-validator'
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, TableInheritance } from 'typeorm'
import { IsNonEmptyStringConstraint } from '../validators'
import { StatusList2021Entity, StatusListEntity } from './StatusListEntities'

@Entity('StatusListEntry')
// @Unique('uq_credential_statuslist', ['statusList', 'credentialId']) // disabled because one prop can be null
// @Unique('uq_credentialHash_statuslistId', ['statusList', 'credentialHash']) // disabled because one prop can be null
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class StatusListEntryEntity extends BaseEntity {
  @PrimaryColumn({ name: 'statusListId', type: 'varchar', nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Status list id is required' })
  statusListId!: string

  @PrimaryColumn({ name: 'statusListIndex', type: 'integer', nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Status list index is required' })
  statusListIndex!: number

  @ManyToOne(() => StatusList2021Entity, (statusList) => statusList.statusListEntries)
  @JoinColumn({ name: 'statusListId' })
  statusList!: StatusListEntity

  @Column({ name: 'credentialId', type: 'text', nullable: true })
  credentialId?: string

  @Column({ name: 'credentialHash', length: 128, type: 'varchar', nullable: true, unique: false })
  credentialHash?: string

  @Column({ name: 'correlationId', length: 255, type: 'varchar', nullable: true, unique: false })
  entryCorrelationId?: string

  @Column({ name: 'value', length: 50, type: 'varchar', nullable: true, unique: false })
  value?: string
}
