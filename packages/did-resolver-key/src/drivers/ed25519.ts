// @ts-ignore
import * as u8a from 'uint8arrays'
const { toString } = u8a
import { DIDDocument } from 'did-resolver'
// import { edwardsToMontgomery } from '@noble/curves/ed25519'
import { convertPublicKeyToX25519 } from '@stablelib/ed25519'
import { DID_LD_JSON, KeyToDidDocArgs } from '../types'

function encodeKey(key: Uint8Array, encodeKey?: number) {
  const bytes = new Uint8Array(key.length + 2)
  bytes[0] = encodeKey ?? 0xec
  // The multicodec is encoded as a varint so we need to add this.
  // See js-multicodec for a general implementation
  bytes[1] = 0x01
  bytes.set(key, 2)
  return `z${toString(bytes, 'base58btc')}`
}

export const keyToDidDoc = (args: KeyToDidDocArgs) => {
  const { options } = args
  if (!options?.publicKeyFormat) {
    return keyToDidDoc2020(args)
  }
  switch (options.publicKeyFormat) {
    case 'Ed25519VerificationKey2018':
    case 'X25519KeyAgreementKey2019':
      return keyToDidDoc2018_2019(args)
    case 'Ed25519VerificationKey2020':
    case 'X25519KeyAgreementKey2020':
    case 'Multikey':
      return keyToDidDoc2020(args)
    default:
      throw Error(`${options.publicKeyFormat} not supported yet for the ed25519 driver`)
  }
}
const keyToDidDoc2018_2019 = ({ pubKeyBytes, fingerprint, contentType }: KeyToDidDocArgs): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`

  //todo: Move to noble lib. x25519 values differ between below methods. Current implementation is correct according to DID:key spec
  // const pubKeyHex = toString(pubKeyBytes, 'base16')
  // const x25519PubBytes = edwardsToMontgomery(pubKeyHex)
  const x25519PubBytes = convertPublicKeyToX25519(pubKeyBytes)

  const x25519KeyId = `${did}#${encodeKey(x25519PubBytes)}`
  return {
    ...(contentType === DID_LD_JSON && {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2018/v1',
        'https://w3id.org/security/suites/x25519-2019/v1',
      ],
    }),
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Ed25519VerificationKey2018',
        controller: did,
        publicKeyBase58: toString(pubKeyBytes, 'base58btc'),
      },
      {
        id: x25519KeyId,
        type: 'X25519KeyAgreementKey2019',
        controller: did,
        publicKeyBase58: toString(x25519PubBytes, 'base58btc'),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
    keyAgreement: [x25519KeyId],
  }
}

const keyToDidDoc2020 = ({ pubKeyBytes, fingerprint, contentType }: KeyToDidDocArgs): DIDDocument => {
  const did = `did:key:${fingerprint}`
  const keyId = `${did}#${fingerprint}`
  //todo: Move to noble lib. x25519 values differ between below methods. Current implementation is correct according to DID:key spec
  // const pubKeyHex = u8a.toString(pubKeyBytes, 'base16')
  // const x25519PubBytes = edwardsToMontgomery(pubKeyBytes)
  const x25519PubBytes = convertPublicKeyToX25519(pubKeyBytes)

  const x25519KeyId = `${did}#${encodeKey(x25519PubBytes)}`
  return {
    ...(contentType === DID_LD_JSON && {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/x25519-2020/v1',
      ],
    }),
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: encodeKey(pubKeyBytes, 0xed),
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
    capabilityDelegation: [keyId],
    capabilityInvocation: [keyId],
    keyAgreement: [
      {
        id: x25519KeyId,
        type: 'X25519KeyAgreementKey2020',
        controller: did,
        publicKeyMultibase: encodeKey(x25519PubBytes, 0xec),
      },
    ],
  }
}
export default { keyToDidDoc }
