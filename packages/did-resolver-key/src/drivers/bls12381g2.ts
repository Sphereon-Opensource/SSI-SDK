import { DIDDocument } from 'did-resolver'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { toString } = u8a
import { KeyToDidDocArgs } from '../index'

export const keyToDidDoc = ({ pubKeyBytes, fingerprint }: KeyToDidDocArgs): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  return {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Bls12381G2Key2020',
        controller: did,
        publicKeyBase58: toString(pubKeyBytes, 'base58btc'),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
  }
}
export default { keyToDidDoc }
