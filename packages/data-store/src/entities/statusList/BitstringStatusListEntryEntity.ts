import { ChildEntity, Column } from 'typeorm'
import { StatusListEntryEntity } from './StatusList2021EntryEntity'
import { BitstringStatus } from '../../types/statusList/bitstringTypes'

@ChildEntity('bitstring')
export class BitstringStatusListEntryEntity extends StatusListEntryEntity {
  @Column({ type: 'varchar', name: 'statusPurpose', nullable: false })
  statusPurpose!: string

  @Column({ type: 'integer', name: 'bitsPerStatus', nullable: true, default: 1 })
  bitsPerStatus?: number

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
