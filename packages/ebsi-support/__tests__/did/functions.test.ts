import { generateOrUseProvidedEbsiPrivateKeyHex } from '../../src/did/functions'

describe('functions: key generator', () => {
  it('Secp256k1 should generate random keys', () => {
    const key1 = generateOrUseProvidedEbsiPrivateKeyHex()
    const key2 = generateOrUseProvidedEbsiPrivateKeyHex()
    const key3 = generateOrUseProvidedEbsiPrivateKeyHex()
    expect(key1).toBeDefined()
    expect(key2).toBeDefined()
    expect(key3).toBeDefined()
    expect(key1).not.toBe(key2)
    expect(key2).not.toBe(key3)
  })
  it('Secp256k1 should result in hex length 64', () => {
    expect(generateOrUseProvidedEbsiPrivateKeyHex().length).toBe(64)
  })
})
