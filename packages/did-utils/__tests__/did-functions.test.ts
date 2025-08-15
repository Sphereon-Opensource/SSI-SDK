import elliptic from 'elliptic'
import { describe, expect, it } from 'vitest'
import { base64ToHex, hexKeyFromPEMBasedJwk, jwkToPEM } from '../../x509-utils/src'
import { isEvenHexString } from '../src'

describe('functions: DID ', () => {
  // TODO: Just some experimenting
  it.skip('Secp256k1 should generate random keys', async () => {
    const secp256 = new elliptic.ec('p256')
    const RFC_JWK_VECTOR = {
      alg: 'ES256',
      use: 'sig',
      kty: 'EC',
      crv: 'P-256',
      x: 'SnFXX-dqEyCC6pjtyxnS_yAe5DVhh0UO7zf-8ODFqw',
      y: 'VM8sNv89XBRDfPj_pk9eWDALM1dIQQuOFlbtSh4TxcU',
    }
    console.log(RFC_JWK_VECTOR)
    const pem = jwkToPEM(RFC_JWK_VECTOR)
    console.log(pem)
    const hexKey = hexKeyFromPEMBasedJwk(RFC_JWK_VECTOR)
    console.log(hexKey)

    console.log('----------')
    console.log(base64ToHex(RFC_JWK_VECTOR.x, 'base64url'))
    const xHex = '4a71575fe76a132082ea98edcb19d2ff201ee4356187450eef37fef0e0c5ab'
    console.log(xHex)
    console.log('----------')
    console.log(base64ToHex(RFC_JWK_VECTOR.y, 'base64url'))
    const yHex = '54cf2c36ff3d5c14437cf8ffa64f5e58300b335748410b8e1656ed4a1e13c5c5'
    console.log(yHex)
    console.log('----------')
    expect(isEvenHexString(yHex)).toEqual(false)

    const prefix = /*'04'*/ isEvenHexString(yHex) ? '02' : '03'
    // Uncompressed Hex format: 04<x><y>
    // Compressed Hex format: 02<x> (for even y) or 03<x> (for uneven y)
    const hex = `${prefix}${xHex}`
    // We return directly as we don't want to convert the result back into Uint8Array and then convert again to hex as the elliptic lib already returns hex strings
    const publicKeyHex = secp256.keyFromPublic(hex, 'hex').getPublic(true, 'hex')
    console.log(publicKeyHex)
  })
})
