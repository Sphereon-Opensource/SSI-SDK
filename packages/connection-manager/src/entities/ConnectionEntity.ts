import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { BaseConfigEntity } from './BaseConfigEntity'
import { ConnectionTypeEnum } from '../types/IConnectionManager'
import { ConnectionIdentifierEntity } from './ConnectionIdentifierEntity'
import { MetadataItemEntity } from './MetadataItemEntity'
import { PartyEntity } from './PartyEntity'

@Entity('Connection')
export class ConnectionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('simple-enum',{ nullable: false })
  type!: ConnectionTypeEnum;

  @OneToOne((type: ConnectionIdentifierEntity) => ConnectionIdentifierEntity, { cascade: true })
  @JoinColumn()
  identifier!: ConnectionIdentifierEntity;

  @OneToOne((type: BaseConfigEntity) => BaseConfigEntity, { cascade: true })
  @JoinColumn()
  config!: BaseConfigEntity;

  @OneToMany(() => MetadataItemEntity, (metadata: MetadataItemEntity) => metadata.connection, { cascade: true })
  @JoinColumn()
  metadata!: Array<MetadataItemEntity>;

  @ManyToOne(() => PartyEntity, party => party.connections, {
    onDelete: 'CASCADE'
  })
  party!: PartyEntity

  @CreateDateColumn({ type: 'datetime', name: 'created_at', nullable: false  })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date;
}
