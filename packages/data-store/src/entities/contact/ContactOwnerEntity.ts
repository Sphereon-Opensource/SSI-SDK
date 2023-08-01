import { BaseEntity, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm'
import { ContactEntity } from './ContactEntity'

@Entity('ContactOwner')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class ContactOwnerEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @OneToOne(() => ContactEntity, (contact: ContactEntity) => contact.contactOwner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contactId' })
  contact!: ContactEntity
}
