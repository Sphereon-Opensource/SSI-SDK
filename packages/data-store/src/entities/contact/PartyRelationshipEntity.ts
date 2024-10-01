import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
  JoinColumn,
} from 'typeorm'
import { typeOrmDateTime } from '@sphereon/ssi-sdk.agent-config'
import { PartyEntity } from './PartyEntity'

@Entity('PartyRelationship')
@Index('IDX_PartyRelationship_left_right', ['left', 'right'], { unique: true })
export class PartyRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => PartyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'left_id' })
  left!: PartyEntity

  @Column('text', { name: 'left_id', nullable: false })
  leftId!: string

  @ManyToOne(() => PartyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'right_id' })
  right!: PartyEntity

  @Column('text', { name: 'right_id', nullable: false })
  rightId!: string

  @Column('text', { name: 'owner_id', nullable: true })
  ownerId?: string

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @CreateDateColumn({ name: 'created_at', nullable: false, type: typeOrmDateTime() })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false, type: typeOrmDateTime() })
  lastUpdatedAt!: Date

  // By default, @UpdateDateColumn in TypeORM updates the timestamp only when the entity's top-level properties change.
  @BeforeInsert()
  @BeforeUpdate()
  updateUpdatedDate(): void {
    this.lastUpdatedAt = new Date()
  }

  @BeforeInsert()
  @BeforeUpdate()
  async checkRelationshipSides(): Promise<void> {
    if ((this.left?.id ?? this.leftId) === (this.right?.id ?? this.rightId)) {
      return Promise.reject(Error('Cannot use the same id for both sides of the relationship'))
    }
  }
}
