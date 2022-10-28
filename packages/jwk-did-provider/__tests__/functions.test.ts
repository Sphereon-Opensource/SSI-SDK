import { generatePrivateKeyHex } from '../src/functions'
import { Key } from '../src/types/jwk-provider-types'

describe('functions: key generator', () => {
  it('Secp256k1 should generate random keys', () => {
    const key1 = generatePrivateKeyHex(Key.Secp256k1)
    const key2 = generatePrivateKeyHex(Key.Secp256k1)
    const key3 = generatePrivateKeyHex(Key.Secp256k1)
    expect(key1).toBeDefined()
    expect(key2).toBeDefined()
    expect(key3).toBeDefined()
    expect(key1).not.toBe(key2)
    expect(key2).not.toBe(key3)
  })
  it('Secp256k1 should result in hex length 64', () => {
    expect(generatePrivateKeyHex(Key.Secp256k1).length).toBe(64)
  })

  it('Secp256r1 should generate random keys', () => {
    const key1 = generatePrivateKeyHex(Key.Secp256r1)
    const key2 = generatePrivateKeyHex(Key.Secp256r1)
    const key3 = generatePrivateKeyHex(Key.Secp256r1)
    expect(key1).toBeDefined()
    expect(key2).toBeDefined()
    expect(key3).toBeDefined()
    expect(key1).not.toBe(key2)
    expect(key2).not.toBe(key3)
  })
  it('Secp256r1 should result in hex length 64', () => {
    expect(generatePrivateKeyHex(Key.Secp256r1).length).toBe(64)
  })

  it('Ed25519 should generate random keys', () => {
    const key1 = generatePrivateKeyHex(Key.Ed25519)
    const key2 = generatePrivateKeyHex(Key.Ed25519)
    const key3 = generatePrivateKeyHex(Key.Ed25519)
    expect(key1).toBeDefined()
    expect(key2).toBeDefined()
    expect(key3).toBeDefined()
    expect(key1).not.toBe(key2)
    expect(key2).not.toBe(key3)
  })
  it('Ed25519 should result in hex length 128', () => {
    expect(generatePrivateKeyHex(Key.Ed25519).length).toBe(128)
  })
})
