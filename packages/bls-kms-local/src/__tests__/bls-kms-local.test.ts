import {BlsKeyManagementSystem} from '../agent/BlsKeyManagementSystem'
import {MemoryPrivateKeyStore} from "../agent/memory-key-store";
import {TKeyType} from "../types/IIdentifier";

import {generateBls12381G2KeyPair} from '@mattrglobal/bbs-signatures';

describe('@sphereon/ssi-sdk-bls-kms-local', () => {

  it('should import a BLS key', async () => {
    const bls = await generateBls12381G2KeyPair();
    const kms = new BlsKeyManagementSystem(new MemoryPrivateKeyStore());
    const myKey = {
      type: <TKeyType> 'BLS',
      privateKeyHex: Buffer.from(bls.secretKey).toString('hex'),
      publicKeyHex: Buffer.from(bls.publicKey).toString('hex')
    }
    const key = await kms.importKey(myKey);
    expect(key.publicKeyHex).toEqual(myKey.publicKeyHex);
  })
})
