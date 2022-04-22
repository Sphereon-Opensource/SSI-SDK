import { BlsKeyManagementSystem } from '../agent/BlsKeyManagementSystem'
import {MemoryKeyStore} from "../agent/memory-key-store";
import {TKeyType} from "../types/IIdentifier";

import { generateBls12381G2KeyPair } from '@mattrglobal/bbs-signatures';

describe('@veramo/kms-local', () => {

  it('should import a BLS key', async () => {
    const bls = await generateBls12381G2KeyPair();
    const kms = new BlsKeyManagementSystem(new MemoryKeyStore())
    const myKey = {
      type: <TKeyType> 'BLS',
      privateKeyHex: new Uint8Array(bls.secretKey.buffer).toString(),
      publicKeyHex: new Uint8Array(bls.publicKey.buffer).toString()
    }
    const key = await kms.importKey(myKey)
    expect(key.privateKeyHex).toEqual(myKey.publicKeyHex);
    expect(key.publicKeyHex).toEqual(myKey.publicKeyHex);
  })

})
