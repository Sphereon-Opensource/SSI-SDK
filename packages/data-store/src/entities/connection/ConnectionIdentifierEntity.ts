import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity
} from 'typeorm'
import {
  ConnectionIdentifierEnum,
  IBasicConnectionIdentifier
} from '@sphereon/ssi-sdk-core'

@Entity('ConnectionIdentifier')
export class ConnectionIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { nullable: false })
  type!: ConnectionIdentifierEnum;

  @Column('text', { name: 'correlation_id', nullable: false })
  correlationId!: string
}

export const connectionIdentifierEntityFrom = (identifier: IBasicConnectionIdentifier): ConnectionIdentifierEntity => {
  const identifierEntity = new ConnectionIdentifierEntity()
  identifierEntity.type = identifier.type
  identifierEntity.correlationId = identifier.correlationId

  return identifierEntity
}
