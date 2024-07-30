import {
  IIssuer,
  JwtDecodedVerifiableCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
  W3CVerifiableCredential,
} from '@sphereon/ssi-types'
import { ProofFormat } from '@veramo/core'
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn, Unique } from 'typeorm'
import { StatusListEntryEntity } from './StatusList2021EntryEntity'

@Entity('StatusList')
@Unique('UQ_correlationId', ['correlationId'])
export class StatusListEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  id!: string

  @Column({ name: 'correlationId', type: 'varchar', nullable: false })
  correlationId!: string

  @Column({ name: 'length', type: 'integer', nullable: false, unique: false })
  length!: number

  @Column({
    name: 'issuer',
    type: 'text',
    nullable: false,
    unique: false,
    transformer: {
      from(value: string): string | IIssuer {
        if (value?.trim()?.startsWith('{')) {
          return JSON.parse(value)
        }
        return value
      },
      to(value: string | IIssuer): string {
        if (typeof value === 'string') {
          return value
        }
        return JSON.stringify(value)
      },
    },
  })
  issuer!: string | IIssuer

  @Column('simple-enum', { name: 'type', enum: StatusListType, nullable: false, default: StatusListType.StatusList2021 })
  type!: StatusListType

  @Column('simple-enum', { name: 'driverType', enum: StatusListDriverType, nullable: false, default: StatusListDriverType.AGENT_TYPEORM })
  driverType!: StatusListDriverType

  @Column('simple-enum', {
    name: 'credentialIdMode',
    enum: StatusListCredentialIdMode,
    nullable: false,
    default: StatusListCredentialIdMode.ISSUANCE,
  })
  credentialIdMode!: StatusListCredentialIdMode

  @Column({ type: 'varchar', name: 'proofFormat', enum: ['lds', 'jwt'], nullable: false, default: 'lds' })
  proofFormat!: ProofFormat

  @Column({ type: 'varchar', name: 'indexingDirection', enum: ['rightToLeft'], nullable: false, default: 'rightToLeft' })
  indexingDirection!: StatusListIndexingDirection

  @Column({ type: 'varchar', name: 'statusPurpose', nullable: false, default: 'revocation' })
  statusPurpose!: StatusPurpose2021

  @Column({
    name: 'statusListCredential',
    type: 'text',
    nullable: true,
    unique: false,
    transformer: {
      from(value: string): W3CVerifiableCredential | JwtDecodedVerifiableCredential {
        if (value?.startsWith('ey')) {
          return value
        }
        return JSON.parse(value)
      },
      to(value: W3CVerifiableCredential | JwtDecodedVerifiableCredential): string {
        if (typeof value === 'string') {
          return value
        }
        return JSON.stringify(value)
      },
    },
  })
  statusListCredential?: W3CVerifiableCredential | JwtDecodedVerifiableCredential

  @OneToMany((type) => StatusListEntryEntity, (entry) => entry.statusList)
  statusListEntries!: StatusListEntryEntity[]
}
