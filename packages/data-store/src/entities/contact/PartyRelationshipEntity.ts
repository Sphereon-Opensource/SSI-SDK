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
import { PartyEntity } from './PartyEntity'

@Entity('PartyRelationship')
@Index('IDX_PartyRelationshipEntity_left_right', ['left', 'right'], { unique: true })
export class PartyRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => PartyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'left_id' })
  left!: PartyEntity

  @Column({ name: 'left_id', nullable: false })
  leftId!: string

  @ManyToOne(() => PartyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'right_id' })
  right!: PartyEntity

  @Column({ name: 'right_id', nullable: false })
  rightId!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  async checkRelationshipSides(): Promise<void> {
    if ((this.left?.id ?? this.leftId) === (this.right?.id ?? this.rightId)) {
      return Promise.reject(Error('Cannot use the same id for both sides of the relationship'))
    }
  }
}
