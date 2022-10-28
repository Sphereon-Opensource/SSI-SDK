import { createAgent, IIdentifier, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { JwkDIDProvider, KeyUse } from '../src'
import { Key } from '../src'

const DID_METHOD = 'did:jwk'
const PRIVATE_KEY_HEX = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const agent = createAgent<IKeyManager, DIDManager>({
  plugins: [
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new KeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      providers: {
        [DID_METHOD]: jwkDIDProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
  ],
})

describe('@sphereon/jwk-did-provider', () => {
  it('should create identifier', async () => {
    const identifier: IIdentifier = await agent.didManagerCreate()

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(1)
  })

  it('should create consistent identifier with provided key', async () => {
    const options = {
      key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()
    expect(identifier.did).toBe(
      'did:jwk:eyJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJvankweURrQnJNTHJENFVsbVdFTjRNcnF3bUNfanRCZWY1QXVxc0Q1eU5jIiwieSI6IlRkU0VHNVRSTkNUVEt2anNEcGwyMjVxX3AtT2xuaERWWmNYVTJRRzB2bU0ifQ'
    )
  })

  it('should remove identifier', async () => {
    const options = {
      key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()

    const deletePromise = agent.didManagerDelete({ did: identifier.did, options: { anchor: false } })
    try {
      await expect(deletePromise).resolves.toBeTruthy()
    } catch (error) {
      expect(JSON.stringify(error)).toMatch('An operation request already exists in queue for DID')
    }
  })

  it('should create identifier with Secp256k1 key', async () => {
    const options = { type: Key.Secp256k1 }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(1)
    expect(identifier.keys[0].type).toBe(Key.Secp256k1)
  })

  it('should create identifier with Ed25519 key', async () => {
    const options = { type: Key.Ed25519 }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(1)
    expect(identifier.keys[0].type).toBe(Key.Ed25519)
  })

  it('should throw error when importing key without privateKeyHex', async () => {
    const options = {
      key: {},
    }
    await expect(agent.didManagerCreate({ options })).rejects.toThrow('We need to have a private key when importing a key')
  })

  it('should throw error for keys Ed25519 with key usage encryption', async () => {
    const options = {
      type: Key.Ed25519,
      use: KeyUse.Encryption,
    }
    await expect(agent.didManagerCreate({ options })).rejects.toThrow('Ed25519 keys are only valid for signatures')
  })
})
