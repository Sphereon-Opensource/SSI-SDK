import u8a from 'uint8arrays'
import * as ed25519 from '@stablelib/ed25519'
import { DIDDocument } from 'did-resolver'

function encodeKey(key: Uint8Array) {
  const bytes = new Uint8Array(key.length + 2)
  bytes[0] = 0xec
  bytes[1] = 0x01
  bytes.set(key, 2)
  return `z${u8a.toString(bytes, 'base58btc')}`
}
export const keyToDidDoc = (pubKeyBytes: Uint8Array, fingerprint: string): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  const x25519PubBytes = ed25519.convertPublicKeyToX25519(pubKeyBytes)
  const x25519KeyId = `${did}#${encodeKey(x25519PubBytes)}`
  return {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Ed25519VerificationKey2018',
        controller: did,
        publicKeyBase58: u8a.toString(pubKeyBytes, 'base58btc'),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
    keyAgreement: [
      {
        id: x25519KeyId,
        type: 'X25519KeyAgreementKey2019',
        controller: did,
        publicKeyBase58: u8a.toString(x25519PubBytes, 'base58btc'),
      },
    ],
  }
}
export default { keyToDidDoc }
