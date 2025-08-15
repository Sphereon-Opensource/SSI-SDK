import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { describe, expect, it } from 'vitest'
import { SphereonKeyManager } from '../agent/SphereonKeyManager'

describe('@sphereon/ssi-sdk-ext.key-manager key functionalities', () => {
  const kms = new SphereonKeyManager({
    store: new MemoryKeyStore(),
    kms: {
      local: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
    },
  })

  it('should create and fetch a RSA key', async () => {
    const key = await kms.keyManagerCreate({ type: 'RSA', kms: 'local' })
    const fetchByKid = await kms.keyManagerGet({ kid: key.kid })
    expect(fetchByKid.kid).toEqual(key.kid)
    expect(fetchByKid.publicKeyHex).toEqual(key.publicKeyHex)
    expect(fetchByKid?.meta?.publicKeyJwk).toBeDefined()
    expect(fetchByKid?.meta?.publicKeyPEM).toBeDefined()
    expect(fetchByKid.type).toEqual('RSA')
    const fetchByPublicKeyHex = await kms.keyManagerGet({ kid: key.publicKeyHex })
    expect(fetchByPublicKeyHex.kid).toEqual(key.kid)
    expect(fetchByPublicKeyHex?.meta?.publicKeyJwk).toBeDefined()
    expect(fetchByPublicKeyHex?.meta?.publicKeyPEM).toBeDefined()
    const deleteByPublicKeyHex = await kms.keyManagerDelete({ kid: key.publicKeyHex })
    expect(deleteByPublicKeyHex).toBeTruthy()
  })

  it('should create and fetch a X25519 key', async () => {
    const key = await kms.keyManagerCreate({ type: 'X25519', kms: 'local' })
    const fetchByKid = await kms.keyManagerGet({ kid: key.kid })
    expect(fetchByKid.type).toEqual('X25519')
    expect(fetchByKid.kid).toEqual(key.kid)
    expect(fetchByKid.publicKeyHex).toEqual(key.publicKeyHex)
  })

  it('should create and fetch a Ed25519 key', async () => {
    const key = await kms.keyManagerCreate({ type: 'Ed25519', kms: 'local' })
    const fetchByKid = await kms.keyManagerGet({ kid: key.kid })
    expect(fetchByKid.type).toEqual('Ed25519')
    expect(fetchByKid.kid).toEqual(key.kid)
    expect(fetchByKid.publicKeyHex).toEqual(key.publicKeyHex)
    const fetchByPublicKeyHex = await kms.keyManagerGet({ kid: key.publicKeyHex })
    expect(fetchByPublicKeyHex.kid).toEqual(key.kid)
  })

  it('should create and fetch a Secp256k1 key', async () => {
    const key = await kms.keyManagerCreate({ type: 'Secp256k1', kms: 'local' })
    const fetchByKid = await kms.keyManagerGet({ kid: key.kid })
    expect(fetchByKid.type).toEqual('Secp256k1')
    expect(fetchByKid.kid).toEqual(key.kid)
    expect(fetchByKid.publicKeyHex).toEqual(key.publicKeyHex)
    expect(fetchByKid?.meta?.algorithms).toEqual(['ES256K', 'ES256K-R', 'eth_signTransaction', 'eth_signTypedData', 'eth_signMessage', 'eth_rawSign'])
    const fetchByPublicKeyHex = await kms.keyManagerGet({ kid: key.publicKeyHex })
    expect(fetchByPublicKeyHex.kid).toEqual(key.kid)
    const fetchByThumbprint = await kms.keyManagerGet({ kid: key?.meta?.jwkThumbprint })
    expect(fetchByThumbprint.kid).toEqual(fetchByThumbprint.kid)
  })

  it('should create and fetch a Secp256r1 key', async () => {
    const key = await kms.keyManagerCreate({ type: 'Secp256r1', kms: 'local' })
    const fetchByKid = await kms.keyManagerGet({ kid: key.kid })
    expect(fetchByKid.kid).toEqual(key.kid)
    expect(fetchByKid.type).toEqual('Secp256r1')
    expect(fetchByKid.publicKeyHex).toEqual(key.publicKeyHex)
    expect(fetchByKid?.meta?.algorithms).toEqual(['ES256'])
    const fetchByPublicKeyHex = await kms.keyManagerGet({ kid: key.publicKeyHex })
    expect(fetchByPublicKeyHex.kid).toEqual(key.kid)
    const fetchByThumbprint = await kms.keyManagerGet({ kid: key?.meta?.jwkThumbprint })
    expect(fetchByThumbprint.kid).toEqual(fetchByThumbprint.kid)
  })
})
