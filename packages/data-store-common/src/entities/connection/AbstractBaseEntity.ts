import { BaseEntity, BeforeInsert, BeforeUpdate, Column, PrimaryGeneratedColumn } from 'typeorm'

export abstract class AbstractBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'created_at', nullable: false })
  createdAt!: string

  @Column({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: string

  // We are using these hooks instead of the @CreatedDate typorm,
  // since we have a need for string dates and need it to be compatible across databases
  @BeforeUpdate()
  public setUpdatedAt() {
    this.lastUpdatedAt = new Date().toISOString()
  }

  @BeforeInsert()
  public setCreatedAt() {
    this.createdAt = new Date().toISOString()
    this.lastUpdatedAt = this.createdAt
  }
}
