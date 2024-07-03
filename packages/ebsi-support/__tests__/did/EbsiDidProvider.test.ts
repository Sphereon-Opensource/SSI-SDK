import { createAgent, IDIDManager, IIdentifier, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { EbsiDidProvider } from '../../src'
import { EbsiPublicKeyPurpose } from '../../src/did'

const DID_METHOD = 'did:ebsi'
const PRIVATE_KEY_HEX = '7dd923e40f4615ac496119f7e793cc2899e99b64b88ca8603db986700089532b'

const ebsiDidProvider = new EbsiDidProvider({
  defaultKms: 'mem',
})

jest.mock('../../src/did/services/EbsiRPCService', () => ({
  ...jest.requireActual('../../src/did/services/EbsiRPCService'),
  callRpcMethod: jest.fn().mockResolvedValue({ result: { r: '', s: '', v: '' } }),
}))

const agent = createAgent<IKeyManager & IDIDManager>({
  plugins: [
    new SphereonKeyManager({
      store: new MemoryKeyStore(),
      kms: {
        mem: new SphereonKeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      providers: {
        [DID_METHOD]: ebsiDidProvider,
      },
      defaultProvider: DID_METHOD,
      store: new MemoryDIDStore(),
    }),
  ],
})

// const PUBLIC_KEY_HEX =
//   '04a23cb4c83901acc2eb0f852599610de0caeac260bf8ed05e7f902eaac0f9c8d74dd4841b94d13424d32af8ec0e9976db9abfa7e3a59e10d565c5d4d901b4be63'
describe('@sphereon/did-provider-ebsi', () => {
  it('should create identifier', async () => {
    const identifier: IIdentifier = await agent.didManagerCreate()

    expect(identifier).toBeDefined()
    expect(identifier.keys.length).toBe(2)
    const secp256k1 = identifier.keys.find((key) => key.type === 'Secp256k1')
    expect(secp256k1).toEqual(
      expect.objectContaining({
        kid: expect.any(String),
        kms: 'mem',
        type: 'Secp256k1',
        publicKeyHex: expect.any(String),
        meta: {
          ebsi: {
            anchored: false,
            controllerKey: true,
          },
          jwkThumbprint: expect.any(String),
          algorithms: ['ES256K', 'ES256K-R', 'eth_signTransaction', 'eth_signTypedData', 'eth_signMessage', 'eth_rawSign'],
          purposes: [EbsiPublicKeyPurpose.CapabilityInvocation],
        },
      }),
    )
    expect(secp256k1?.publicKeyHex?.length).toEqual(66)

    const secp256r1 = identifier.keys.find((key) => key.type === 'Secp256r1')
    expect(secp256r1).toEqual(
      expect.objectContaining({
        kid: expect.any(String),
        kms: 'mem',
        type: 'Secp256r1',
        publicKeyHex: expect.any(String),
        meta: {
          jwkThumbprint: expect.any(String),
          algorithms: ['ES256'],
          purposes: [EbsiPublicKeyPurpose.AssertionMethod, EbsiPublicKeyPurpose.Authentication],
        },
      }),
    )
    expect(secp256r1?.publicKeyHex?.length).toEqual(66)
  })

  it('should create consistent identifier with provided key', async () => {
    const options = {
      methodSpecificId: 'zhv7pXtkn7DHAcDsn5Qk7tp',
      secp256k1Key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()
    expect(identifier.did).toContain('did:ebsi:z')
    // todo: investigate. Probably, should always be 32
    expect(identifier.did.length >= 32 && identifier.did.length <= 33).toBeTruthy()
  })

  it('should remove identifier', async () => {
    const options = {
      secp256k1Key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    }
    const identifier: IIdentifier = await agent.didManagerCreate({ options })

    expect(identifier).toBeDefined()

    const deletePromise = agent.didManagerDelete({ did: identifier.did })

    await expect(deletePromise).resolves.toBeTruthy()
  })

  it('should import a DID with existing private key', async () => {
    await expect(
      agent.didManagerImport({
        did: 'did:ebsi:zhv7pXtkn7DHAcDsnaaa7ap',
        provider: 'did:ebsi',
        keys: [{ kms: 'mem', privateKeyHex: PRIVATE_KEY_HEX, type: 'Secp256k1' }],
      }),
    ).resolves.toMatchObject({ did: 'did:ebsi:zhv7pXtkn7DHAcDsnaaa7ap' })
  })

  it('should throw error for not implemented remove key', async () => {
    await expect(
      agent.didManagerRemoveKey({
        did: 'did:ebsi:zhv7pXtkn7DHAcDsn5Qk7tp',
        kid: 'test',
      }),
    ).rejects.toThrow('Not (yet) implemented for the EBSI did provider')
  })

  it('should succeed for add service', async () => {
    const service = {
      type: 'nope',
      id: 'id',
      description: 'test',
      serviceEndpoint: 'https://nope.com',
    }
    await expect(
      agent.didManagerAddService({
        did: 'did:ebsi:zhv7pXtkn7DHAcDsn5Qk7tp',
        service,
        options: {
          bearerToken: 'example',
        },
      }),
    ).resolves.toBeDefined()
  })

  it('should throw error for not implemented remove service', async () => {
    await expect(
      agent.didManagerRemoveService({
        did: 'did:ebsi:zhv7pXtkn7DHAcDsn5Qk7tp',
        id: 'test',
      }),
    ).rejects.toThrow('Not (yet) implemented for the EBSI did provider')
  })
})
