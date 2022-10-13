import { randomBytes } from '@ethersproject/random'
import { generateKeyPair as generateSigningKeyPair } from '@stablelib/ed25519'
import * as u8a from 'uint8arrays'
import { KeyType } from './types/jwk-provider-types'

/**
 * Generates a random Private Hex Key for the specified key type
 * @param type The key type
 * @return The private key in Hex form
 */
export const generatePrivateKeyHex = (type: KeyType): string => {
  switch (type) {
    case KeyType.Ed25519: {
      const keyPairEd25519 = generateSigningKeyPair()
      return u8a.toString(keyPairEd25519.secretKey, 'base16')
    }
    case KeyType.Secp256k1: {
      const privateBytes = randomBytes(32)
      return u8a.toString(privateBytes, 'base16')
    }
    default:
      throw Error(`not_supported: Key type not supported: ${type}`)
  }
}
