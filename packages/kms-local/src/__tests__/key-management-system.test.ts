import { ManagedKeyInfo } from '@veramo/core'
import { MemoryPrivateKeyStore } from '@veramo/key-manager'
import { describe, expect, it } from 'vitest'
import { SphereonKeyManagementSystem } from '../SphereonKeyManagementSystem'

describe('Key creation', () => {
  it('should create a RSA key', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())
    const key: ManagedKeyInfo = await kms.createKey({ type: 'RSA' })
    expect(key.type).toEqual('RSA')
    expect(key?.meta?.publicKeyJwk?.kty).toEqual('RSA')
  })

  it('should create a Ed25519 key', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())
    const key: ManagedKeyInfo = await kms.createKey({ type: 'Ed25519' })
    expect(key.type).toEqual('Ed25519')
    expect(key?.meta?.algorithms).toContain('Ed25519')
    expect(key.meta).toEqual({ algorithms: ['Ed25519', 'EdDSA'] })
  })

  it('should create a X25519 key', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())
    const key: ManagedKeyInfo = await kms.createKey({ type: 'X25519' })
    expect(key.type).toEqual('X25519')
    expect(key.meta).toEqual({ algorithms: ['ECDH', 'ECDH-ES', 'ECDH-1PU'] })
  })

  it('should create a Secp256k1 key', async () => {
    const kms = new SphereonKeyManagementSystem(new MemoryPrivateKeyStore())
    const key: ManagedKeyInfo = await kms.createKey({ type: 'Secp256k1' })
    expect(key.type).toEqual('Secp256k1')
    expect(key?.meta?.jwkThumbprint).toBeDefined()
    expect(key?.meta?.algorithms).toContain('ES256K')
  })
})
