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
} from 'typeorm'
import { ContactEntity } from './ContactEntity'
import { BasicContactRelationship, IContactRelationship } from '../../types'

@Entity('ContactRelationship')
@Index('IDX_ContactRelationshipEntity_left_right', ['left', 'right'], { unique: true })
export class ContactRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => ContactEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  left!: ContactEntity

  @Column({ name: 'leftId', nullable: false })
  leftId!: string

  @ManyToOne(() => ContactEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  right!: ContactEntity

  @Column({ name: 'rightId', nullable: false })
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

export const contactRelationshipEntityFrom = (relationship: BasicContactRelationship): ContactRelationshipEntity => {
  const contactRelationshipEntity: ContactRelationshipEntity = new ContactRelationshipEntity()
  contactRelationshipEntity.leftId = relationship.leftId
  contactRelationshipEntity.rightId = relationship.rightId

  return contactRelationshipEntity
}

export const contactRelationshipFrom = (relationship: ContactRelationshipEntity): IContactRelationship => {
  return {
    id: relationship.id,
    leftId: relationship.leftId,
    rightId: relationship.rightId,
    createdAt: relationship.createdAt,
    lastUpdatedAt: relationship.lastUpdatedAt,
  }
}
