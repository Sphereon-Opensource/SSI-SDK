import {
  IIssuer,
  StatusListCredential,
  StatusListCredentialIdMode,
  StatusListDriverType,
  StatusListIndexingDirection,
  StatusListType,
  StatusPurpose2021,
  CredentialProofFormat,
} from '@sphereon/ssi-types'
import typeorm from 'typeorm'
const { BaseEntity, ChildEntity, Column, Entity, OneToMany, PrimaryColumn, TableInheritance, Unique } = typeorm
import { StatusListEntryEntity } from './StatusList2021EntryEntity'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'

@Entity('StatusList')
@Unique('UQ_correlationId', ['correlationId'])
@TableInheritance({ column: { type: 'simple-enum', name: 'type', enum: StatusListType } })
export abstract class StatusListEntity extends BaseEntity {
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

  @Column('simple-enum', {
    name: 'driverType',
    enum: StatusListDriverType,
    nullable: false,
    default: StatusListDriverType.AGENT_TYPEORM,
  })
  driverType!: StatusListDriverType

  @Column('simple-enum', {
    name: 'credentialIdMode',
    enum: StatusListCredentialIdMode,
    nullable: false,
    default: StatusListCredentialIdMode.ISSUANCE,
  })
  credentialIdMode!: StatusListCredentialIdMode

  @Column({ type: 'varchar', name: 'proofFormat', enum: ['lds', 'jwt'], nullable: false, default: 'lds' })
  proofFormat!: CredentialProofFormat

  @Column({
    name: 'statusListCredential',
    type: 'text',
    nullable: true,
    unique: false,
    transformer: {
      from(value: string): StatusListCredential {
        if (value?.startsWith('ey')) {
          return value
        }
        return JSON.parse(value)
      },
      to(value: StatusListCredential): string {
        if (typeof value === 'string') {
          return value
        }
        return JSON.stringify(value)
      },
    },
  })
  statusListCredential?: StatusListCredential

  @OneToMany((type) => StatusListEntryEntity, (entry) => entry.statusList)
  statusListEntries!: StatusListEntryEntity[]
}

@ChildEntity(StatusListType.StatusList2021)
export class StatusList2021Entity extends StatusListEntity {
  @Column({
    type: 'varchar',
    name: 'indexingDirection',
    enum: ['rightToLeft'],
    nullable: false,
    default: 'rightToLeft',
  })
  indexingDirection!: StatusListIndexingDirection

  @Column({ type: 'varchar', name: 'statusPurpose', nullable: false, default: 'revocation' })
  statusPurpose!: StatusPurpose2021
}

@ChildEntity(StatusListType.OAuthStatusList)
export class OAuthStatusListEntity extends StatusListEntity {
  @Column({ type: 'integer', name: 'bitsPerStatus', nullable: false })
  bitsPerStatus!: number
  @Column({ name: 'expiresAt', nullable: true, type: typeOrmDateTime() })
  expiresAt?: Date
}
