import { BlsKeyManagementSystem } from '../BlsKeyManagementSystem'
import { MemoryPrivateKeyStore } from '@veramo/key-manager'
import { generateBls12381G2KeyPair } from '@mattrglobal/bbs-signatures'
import { MinimalImportableKey, TKeyType } from '@veramo/core'

describe('@sphereon/ssi-sdk-bls-kms-local', () => {
  it('should import a BLS key', async () => {
    const bls = await generateBls12381G2KeyPair()
    const kms = new BlsKeyManagementSystem(new MemoryPrivateKeyStore())
    const myKey: MinimalImportableKey = {
      kms: 'local',
      type: <TKeyType>'Bls12381G2',
      privateKeyHex: Buffer.from(bls.secretKey).toString('hex'),
      publicKeyHex: Buffer.from(bls.publicKey).toString('hex'),
    }
    const key = await kms.importKey(myKey)
    expect(key.publicKeyHex).toEqual(myKey.publicKeyHex)
  })
})
