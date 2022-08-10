import { Column, Entity, BaseEntity, PrimaryColumn } from 'typeorm'

@Entity('Mnemonic')
export class MnemonicEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id' })
  //@ts-ignore
  id: string
  @Column({ name: 'hash', unique: true })
  //@ts-ignore
  hash: string
  @Column({ name: 'mnemonic', unique: true })
  //@ts-ignore
  mnemonic: string
  @Column({ name: 'master_key', default: null })
  //@ts-ignore
  masterKey: string
  @Column({ name: 'chain_code', default: null })
  //@ts-ignore
  chainCode: string
}
