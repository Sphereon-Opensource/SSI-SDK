import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

/**
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
@Entity('keyvaluestore')
export class KeyValueStoreEntity extends BaseEntity {
  @PrimaryColumn('text')
  key!: string

  @Column({
    type: 'text',
  })
  data!: string

  expires?: number
}
