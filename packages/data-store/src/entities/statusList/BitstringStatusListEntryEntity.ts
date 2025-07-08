import { Validate } from 'class-validator'
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { IsNonEmptyStringConstraint } from '../validators'
import { BitstringStatusListEntity } from './StatusListEntities'
import { BitstringStatusPurpose } from '@sphereon/ssi-types'
import { BitstringStatus } from '../../types'

@Entity('BitstringStatusListEntry')
export class BitstringStatusListEntryEntity extends BaseEntity {
  @PrimaryColumn({ name: 'statusListId', type: 'varchar', nullable: false, unique: false })
  @Validate(IsNonEmptyStringConstraint, { message: 'Status list id is required' })
  statusListId!: string

  @PrimaryColumn({ name: 'statusListIndex', type: 'integer', nullable: false, unique: false })
  statusListIndex!: number

  @ManyToOne(() => BitstringStatusListEntity, (statusList) => statusList.statusListEntries)
  @JoinColumn({ name: 'statusListId' })
  statusList!: BitstringStatusListEntity

  @Column({ name: 'credentialId', type: 'text', nullable: true })
  credentialId?: string

  @Column({ name: 'credentialHash', length: 128, type: 'varchar', nullable: true, unique: false })
  credentialHash?: string

  @Column({ name: 'correlationId', length: 255, type: 'varchar', nullable: true, unique: false })
  entryCorrelationId?: string

  @Column({ type: 'varchar', name: 'statusPurpose', nullable: false })
  statusPurpose!: BitstringStatusPurpose

  @Column({ type: 'integer', name: 'statusSize', nullable: true, default: 1 })
  statusSize?: number

  @Column({
    type: 'text',
    name: 'statusMessage',
    nullable: true,
    transformer: {
      from(value: string): Array<BitstringStatus> | undefined {
        if (!value) {
          return undefined
        }
        return JSON.parse(value)
      },
      to(value: Array<BitstringStatus> | undefined): string | undefined {
        if (!value) {
          return undefined
        }
        return JSON.stringify(value)
      },
    },
  })
  statusMessage?: Array<BitstringStatus>

  @Column({
    type: 'text',
    name: 'statusReference',
    nullable: true,
    transformer: {
      from(value: string): string | string[] | undefined {
        if (!value) {
          return undefined
        }
        if (value.startsWith('[')) {
          return JSON.parse(value)
        }
        return value
      },
      to(value: string | string[] | undefined): string | undefined {
        if (!value) {
          return undefined
        }
        if (Array.isArray(value)) {
          return JSON.stringify(value)
        }
        return value
      },
    },
  })
  statusReference?: string | string[]
}
