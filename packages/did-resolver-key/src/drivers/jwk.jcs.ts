import { DIDDocument, JsonWebKey as DIFJWK } from 'did-resolver'
import { DID_LD_JSON, KeyToDidDocArgs } from '../index'
import { jwkJcsDecode } from '@sphereon/ssi-sdk-ext.key-utils'

export const keyToDidDoc = ({ pubKeyBytes, fingerprint, contentType }: KeyToDidDocArgs): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  const publicKeyJwk = jwkJcsDecode(pubKeyBytes) as DIFJWK
  return {
    ...(contentType === DID_LD_JSON && {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
    }),
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
  }
}
export default { keyToDidDoc }
