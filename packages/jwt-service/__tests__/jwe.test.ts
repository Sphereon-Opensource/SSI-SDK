import * as u8a from 'uint8arrays'
import { describe, it } from 'vitest'
import { CompactJwtEncrypter } from '../src/functions/JWE'

describe('JWE test', () => {
  const ietfPublicJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
    y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
    alg: 'ECDH-ES',
    use: 'enc',
    // d: 'jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI',
  }

  const ietfPrivateJwk = {
    ...ietfPublicJwk,
    d: 'jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI',
  }

  it('should encrypt', async () => {
    const pubKey = await crypto.subtle.importKey(
      'jwk',
      ietfPublicJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    )
    const encrypter = new CompactJwtEncrypter({
      alg: 'ECDH-ES',
      enc: 'A256GCM',
      keyManagementParams: { apu: u8a.fromString('apu'), apv: u8a.fromString('apv') },
      key: pubKey,
    })

    const encrypted = await encrypter.encryptCompactJWT({ hello: 'world' }, {})
    console.log(encrypted)

    const secKey = await crypto.subtle.importKey(
      'jwk',
      ietfPrivateJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    )
    const decrypted = await CompactJwtEncrypter.decryptCompactJWT(encrypted, secKey)
    console.log(JSON.stringify(decrypted, null, 2))
  })

  it('should decrypt agent example', async () => {
    const jwe =
      'eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImVwayI6eyJ4IjoiYkIza0VMaWFtOTBEWExKVU8zQXFCa3RSMmd3TVFWSFBEWUJWUkJ3NEpWWSIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ5IjoiMXVNRTFlWHJQVjR2VVhiZHNYRGpBNno2NGMyYmQ3M0stWWtBVHlRRzNrTSJ9LCJhcHUiOiJZWEIxIiwiYXB2IjoiWVhCMiJ9..gT7grdO892xezIiy.mzWRiE0ajMnqVqVRs3medXCtH4knMBLGWWaPTap8CwCw_TpkVSV2azzz7MsTz6pjGo5iDHWa_AMxuGRCTZVBew.S5WfGjVhFnFwgqPtYdBJzQ'
    const secKey = await crypto.subtle.importKey(
      'jwk',
      ietfPrivateJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    )
    const decrypted = await CompactJwtEncrypter.decryptCompactJWT(jwe, secKey)
    console.log(JSON.stringify(decrypted, null, 2))
  })
})
