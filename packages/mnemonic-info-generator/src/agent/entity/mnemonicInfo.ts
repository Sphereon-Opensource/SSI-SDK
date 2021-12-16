import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('mnemonic_info')
export class MnemonicInfo {
  @PrimaryColumn({ name: 'id' })
  //@ts-ignore
  id: string;
  @Column({ name: 'hash' })
  //@ts-ignore
  hash: string;
  @Column({ name: 'mnemonic' })
  //@ts-ignore
  mnemonic: string;
  @Column({ name: 'master_key', default: null })
  //@ts-ignore
  masterKey: string;
  @Column({ name: 'chain_code', default: null })
  //@ts-ignore
  chainCode: string;
}
