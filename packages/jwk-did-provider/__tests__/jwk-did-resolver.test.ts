import { createAgent, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { Resolver } from 'did-resolver'
import { getDidJwkResolver, JwkDIDProvider } from '../src'

const DID_METHOD = 'did:jwk'
// Generate a new private key in hex format if needed, using the following method:
// console.log(generatePrivateKeyHex(KeyType.Secp256k1))
//const PRIVATE_KEY_HEX = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const agent = createAgent<IKeyManager, DIDManager>({
  plugins: [
    new DIDResolverPlugin({
      resolver: new Resolver({...getDidJwkResolver()})
    }),
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

describe('@sphereon/jwk-did-resolver', () => {
  it('resolve did:jwk', async () => {
    const xx = await agent.resolveDid({ didUrl: 'did:jwk:eyJrdHkiOiJvY3QiLCJrIjoiOE10VndzU0VDOU5abFd2WWlLalpTSlhUWG1FMU5maHFEdkpPeGg0a1RkVSJ9' })
    console.log(xx)
    // 'did:jwk:eyJrdHkiOiJvY3QiLCJrIjoiOE10VndzU0VDOU5abFd2WWlLalpTSlhUWG1FMU5maHFEdkpPeGg0a1RkVSJ9'

    // const identifier: IIdentifier = await agent.didManagerCreate()
    //
    // expect(identifier).toBeDefined()
    // expect(identifier.keys.length).toBe(1)
  })
})
