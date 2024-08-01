import { Validate } from 'class-validator'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { IsNonEmptyStringConstraint } from '../validators'
import { StatusListEntity } from './StatusList2021Entity'

@Entity('StatusListEntry')
// @Unique('uq_credential_statuslist', ['statusList', 'credentialId']) // disabled because one prop can be null
// @Unique('uq_credentialHash_statuslistId', ['statusList', 'credentialHash']) // disabled because one prop can be null
export class StatusListEntryEntity extends BaseEntity {
  @PrimaryColumn({ name: 'statusListId', type: 'varchar' })
  @ManyToOne(() => StatusListEntity, (statusList) => statusList.statusListEntries)
  statusList!: StatusListEntity

  @PrimaryColumn({ name: 'statusListIndex', type: 'integer', nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Status list index is required' })
  statusListIndex!: number

  @Column({ name: 'credentialId', type: 'text', nullable: true })
  credentialId?: string

  @Column({ name: 'credentialHash', length: 128, type: 'varchar', nullable: true, unique: false })
  credentialHash?: string

  @Column({ name: 'correlationId', length: 255, type: 'varchar', nullable: true, unique: false })
  correlationId?: string

  @Column({ name: 'value', length: 50, type: 'varchar', nullable: true, unique: false })
  value?: string
}
