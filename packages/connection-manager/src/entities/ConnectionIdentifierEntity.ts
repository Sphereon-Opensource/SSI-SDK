import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity
} from 'typeorm'
import { ConnectionIdentifierEnum } from '../types/IConnectionManager'

@Entity('ConnectionIdentifier')
export class ConnectionIdentifierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { nullable: false })
  type!: ConnectionIdentifierEnum;

  @Column('text', { name: 'correlation_id', nullable: false })
  correlationId!: string
}
