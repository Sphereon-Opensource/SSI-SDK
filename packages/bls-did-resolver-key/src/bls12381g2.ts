import { DIDDocument } from 'did-resolver'
import u8a from 'uint8arrays'

export const keyToDidDoc = (pubKeyBytes: Uint8Array, fingerprint: string): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  return {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Bls12381G2Key2020',
        controller: did,
        publicKeyBase58: u8a.toString(pubKeyBytes, 'base58btc'),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
  }
}
export default { keyToDidDoc }
