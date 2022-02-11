import { createAgent, IDIDManager, IIdentifier, IKeyManager, IKeyManagerCreateArgs, IResolver, ManagedKeyInfo, TAgent } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { FactomDIDProvider, IRequiredContext } from '../factom-did-provider'
import { getUniResolver } from '@sphereon/did-uni-client'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'

// const kms = new KeyManagementSystem(new MemoryPrivateKeyStore())
const memoryDIDStore = new MemoryDIDStore()

const factomDIDProvider = new FactomDIDProvider({
  defaultKms: 'local',
  defaultNetwork: 'MAINNET',
  registrarUrl: 'https://uniregistrar.test.sphereon.io',
})

const didManager = new DIDManager({
  providers: { 'did:factom': factomDIDProvider },
  defaultProvider: 'did:factom',
  store: memoryDIDStore,
})

let agent: TAgent<IResolver & IKeyManager & IDIDManager>

jest.setTimeout(100000)

beforeAll(async () => {
  agent = createAgent({
    plugins: [
      new KeyManager({
        store: new MemoryKeyStore(),
        kms: {
          local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
        },
      }),
      didManager,
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...getUniResolver('factom'),
        }),
      }),
    ],
  })
})

describe('@sphereon/factom-did-provider', () => {
  const mockContext = {
    agent: {
      keyManagerCreate(args: IKeyManagerCreateArgs): Promise<ManagedKeyInfo> {
        return agent.keyManagerCreate(args)
      },
    },
  } as IRequiredContext
  /*const mockContext = {
    agent: {
      keyManagerCreate(_args: IKeyManagerCreateArgs): Promise<ManagedKeyInfo> {
        return Promise.resolve({ publicKeyHex: 'aabbcc', kid: 'testKid' } as ManagedKeyInfo)
      },
      keyManagerImport(args: MinimalImportableKey): Promise<ManagedKeyInfo> {
        return Promise.resolve({
          publicKeyHex: args.publicKeyHex || 'aabbcc',
          type: args.type,
          kms: args.kms,
          kid: args.kid || 'testKid',
        })
      },
    } as IKeyManager,
  } as IRequiredContext*/

  it('should create identifier', () => {
    // jest.spyOn(fetch, '').mockResolvedValueOnce(Promise.resolve(restResponse));
    const identifier = factomDIDProvider.createIdentifier(
      {
        options: {
          managementKeys: [{ priority: 0, kid: 'mgmt1' }],
          didKeys: [
            {
              kid: 'key1',
              priorityRequirement: 0,
              purpose: ['verificationMethod', 'assertionMethod'],
            },
          ],
          tags: ['example', 'ssi-sdk'],
          nonce: new Date().toISOString(),
        },
      },
      mockContext
    )

    expect.assertions(2)
    return assertExpectedIdentifier(identifier)
  })
})

async function assertExpectedIdentifier(identifier: Promise<Omit<IIdentifier, 'provider'>>) {
  // await expect(identifier).resolves.toContain('did')
  await expect(identifier).resolves.toHaveProperty('did')
  return await expect(identifier).resolves.toHaveProperty('controllerKeyId')
  /*await expect(identifier).resolves.toHaveProperty('keys', [
    {
      kid: LTO_KID,
      kms: 'local',
      type: 'Ed25519',
      publicKeyHex: PUBLIC_KEY_HEX,
    },
  ])
  return expect(identifier).resolves.toHaveProperty('services', [])*/
}
