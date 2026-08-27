import { createAgent, IDIDManager, IIdentifier, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { OydDIDProvider } from '../src'
import { DefaultOydCmsmCallbacks } from '../src/oyd-did-provider'
import { describe, expect, it } from 'vitest'
const crypto = require('crypto')
const DID_METHOD = 'did:oyd'

const keyManager = new SphereonKeyManager({
  store: new MemoryKeyStore(),
  kms: {
    mem: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
  },
})
const oydDIDProvider = new OydDIDProvider({
  defaultKms: 'mem',
  clientManagedSecretMode: new DefaultOydCmsmCallbacks(keyManager),
})
const agent = createAgent<IKeyManager & IDIDManager>({
  plugins: [
    keyManager,
    new DIDManager({
      providers: {
        [DID_METHOD]: oydDIDProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
  ],
})

describe('@sphereon/did-provider-oyd', () => {
  it('should create identifier', { timeout: 30000 }, async () => {
    const identifier: IIdentifier = await agent.didManagerCreate({ options: { keyType: 'Secp256r1', kid: 'test', cmsm: { enabled: true } } })

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(1)

  })

  it('should create identifier with CMSM', { timeout: 30000 }, async () => {
    const privateKeyHex = generatePrivateKeyHex()
    const key = await agent.keyManagerImport({ privateKeyHex, kid: 'test', type: 'Secp256r1', kms: 'mem' })

    const identifier: IIdentifier = await agent.didManagerCreate({
      options: { keyType: 'Secp256r1', kid: 'test-cmsm', key, cmsm: { enabled: true, create: false } },
    })

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(1)
    expect(identifier.did).toMatch(/^did:oyd:/)
    // the client signed the revocation record; the registrar cannot reproduce it
    expect(identifier.keys[0].meta?.oyd?.logRevoke).toBeDefined()
  })
})

// The order of the secp256r1 curve:
// n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
const CURVE_ORDER = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551')

function generatePrivateKeyHex() {
  let d: bigint
  do {
    // 32 random bytes → hex → BigInt
    const buf = crypto.randomBytes(32)
    d = BigInt('0x' + buf.toString('hex'))
  } while (d == BigInt(0) || d >= CURVE_ORDER)

  // back to hex, padded to 64 chars (32 bytes)
  return d.toString(16).padStart(64, '0')
}
