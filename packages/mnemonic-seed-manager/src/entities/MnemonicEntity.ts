import { Column, Entity, BaseEntity, PrimaryColumn } from 'typeorm'

@Entity('Mnemonic')
export class MnemonicEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  id!: string
  @Column({ name: 'hash', unique: true, type: 'varchar' })
  hash!: string
  @Column({ name: 'mnemonic', unique: true, type: 'varchar' })
  mnemonic!: string
  @Column({ name: 'master_key', default: null, type: 'varchar' })
  masterKey!: string
  @Column({ name: 'chain_code', default: null, type: 'varchar' })
  chainCode!: string
}
