import {
  Entity,
  // JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  // Column,
  Index, BeforeInsert, BeforeUpdate, Column
} from 'typeorm'
import { ContactEntity } from './ContactEntity'
import { IContactRelationship } from '../../types'

@Entity()
// @Index(['leftContactId', 'rightContactId'], { unique: true }) // TODO name\
@Index(['left', 'right'], { unique: true }) // TODO name
export class ContactRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => ContactEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'left_contact_id' })
  left!: ContactEntity

  @Column({ name: 'left', nullable: true })
  leftContactId?: string

  @ManyToOne(() => ContactEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'right_contact_id' })
  right!: ContactEntity

  @Column({ name: 'right', nullable: true })
  rightContactId?: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @BeforeInsert()
  @BeforeUpdate()
  async checkRelationshipSides(): Promise<void> {
    if (this.left.id === this.right.id) {
      return Promise.reject(Error('Cannot use the same id for both sides of the relationship'))
    }
  }
}

// TODO interface
export const contactRelationshipEntityFrom = (relationship: { left: ContactEntity; right: ContactEntity }): ContactRelationshipEntity => {
  // TODO convert IContact to ContactEntity here

  const contactRelationshipEntity: ContactRelationshipEntity = new ContactRelationshipEntity()
  contactRelationshipEntity.left = relationship.left
  contactRelationshipEntity.right = relationship.right
  return contactRelationshipEntity
}

export const contactRelationshipFrom = (relationship: ContactRelationshipEntity): IContactRelationship => {
  console.log('')
  return {
    id: relationship.id,
    leftContactId: relationship.left.id,
    rightContactId: relationship.right.id,
    createdAt: relationship.createdAt,
    lastUpdatedAt: relationship.lastUpdatedAt
  }
  // TODO convert IContact to ContactEntity here
}
