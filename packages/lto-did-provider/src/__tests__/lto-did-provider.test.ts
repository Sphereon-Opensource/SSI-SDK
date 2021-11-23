import { LtoDidProvider } from '../lto-did-provider'
import { IDidConnectionMode, IRequiredContext } from '../types/lto-provider-types'
import { Network, DIDService } from '@sphereon/lto-did-ts'
import { IKeyManager, IKeyManagerCreateArgs, MinimalImportableKey, ManagedKeyInfo, IIdentifier } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'

const PRIVATE_KEY_HEX =
  'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const LTO_DID = 'did:lto:3MzYSqyo8GBMsY8u8F2WEuoVXYuq6hnKzyj'
const LTO_KID = `${LTO_DID}#key`
const SPONSOR_PRIVATE_KEY_BASE58 = '5gqCU5NbwU4gc62be39LXDDALKj8opj1KZszx7ULJc2k33kk52prn8D1H2pPPwm6QVKvkuo72YJSoUhzzmAFmDH8'
const LTO_KEY = {
  kid: LTO_KID,
  kms: 'local',
  type: 'Ed25519' as const,
  privateKeyHex: PRIVATE_KEY_HEX,
  publicKeyHex: PUBLIC_KEY_HEX,
}
const IDENTIFIER = {
  did: LTO_DID,
  provider: 'did:lto',
  controllerKeyId: LTO_KID,
  keys: [LTO_KEY],
}

// const kms = new KeyManagementSystem(new MemoryPrivateKeyStore())
const memoryDIDStore = new MemoryDIDStore()

const ltoDIDProvider = new LtoDidProvider({
  defaultKms: 'local',
  connectionMode: IDidConnectionMode.NODE,
  sponsorPrivateKeyBase58: SPONSOR_PRIVATE_KEY_BASE58,
  network: Network.TESTNET,
})

const didManager = new DIDManager({
  providers: { 'did:lto': ltoDIDProvider },
  defaultProvider: 'did:lto',
  store: memoryDIDStore,
})

describe('@sphereon/lto-did-provider', () => {
  const mockContext = {
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
  } as IRequiredContext

  it('should create identifier', async () => {
    const restResponse = {
      data: {
        didIdentifier: 'TestDID',
      },
    }

    // jest.spyOn(fetch, '').mockResolvedValueOnce(Promise.resolve(restResponse));
    const identifier = await ltoDIDProvider.createIdentifier(
      {
        options: {
          privateKeyHex: PRIVATE_KEY_HEX,
        },
      },
      mockContext
    )

    /*expect(provider).not.toHaveProperty('resolveDid')
        expect(axios.post).toHaveBeenCalledWith(`${AppConfig.credencoBackendUrl}/did`, {"publicKeyBase58": "0xmyPublicKey"}, {"headers": {"Content-Type": "application/json"}});*/
    assertExpectedIdentifier(identifier)
  })

  it('should create identifier with verificationMethods', async () => {
    const identifier = await ltoDIDProvider.createIdentifier(
      {
        options: {
          privateKeyHex: PRIVATE_KEY_HEX,
          verificationMethods: [256],
        },
      },
      mockContext
    )

    assertExpectedIdentifier(identifier)
  })

  it('should properly import identifier using DID manager', async () => {
    const importedIdentifier = await didManager.didManagerImport(IDENTIFIER, mockContext)
    assertExpectedIdentifier(importedIdentifier)
    assertExpectedIdentifier(await didManager.didManagerGet({ did: LTO_DID }))
  })

  it('should add verification key', async () => {
    const address = '3MzYSqyo8GBMsY8u8F2WEuoVXYuq6hnKzyj'

    const mockAddVerificationMethod = jest.fn()
    DIDService.prototype.addVerificationMethod = mockAddVerificationMethod
    mockAddVerificationMethod.mockReturnValue(Promise.resolve({ address }))

    const result = await ltoDIDProvider.addKey(
      {
        identifier: {
          ...IDENTIFIER,
          services: [],
        },
        key: LTO_KEY,
        options: {
          verificationMethod: 256,
        },
      },
      mockContext
    )

    expect(result).toEqual(`did:lto:${address}#key`)

    // jest.resetAllMocks();
  })

  it('addKey should throw error without controllerKeyId', async () => {
    await expect(
      ltoDIDProvider.addKey(
        {
          identifier: {
            ...IDENTIFIER,
            controllerKeyId: '',
            services: [],
          },
          key: LTO_KEY,
          options: {
            verificationMethod: 256,
          },
        },
        mockContext
      )
    ).rejects.toThrow('No controller key id found')
  })

  it('addKey should throw error without matching key present', async () => {
    await expect(
      ltoDIDProvider.addKey(
        {
          identifier: {
            ...IDENTIFIER,
            keys: [
              {
                ...LTO_KEY,
                kid: '',
              },
            ],
            services: [],
          },
          key: LTO_KEY,
          options: {
            verificationMethod: 256,
          },
        },
        mockContext
      )
    ).rejects.toThrow('No matching key found')
  })

  it('addKey should throw error without private key hex', async () => {
    await expect(
      ltoDIDProvider.addKey(
        {
          identifier: {
            ...IDENTIFIER,
            keys: [
              {
                ...LTO_KEY,
                privateKeyHex: '',
              },
            ],
            services: [],
          },
          key: LTO_KEY,
          options: {
            verificationMethod: 256,
          },
        },
        mockContext
      )
    ).rejects.toThrow('No private key hex found')
  })
})

function assertExpectedIdentifier(identifier: Omit<IIdentifier, 'provider'>) {
  expect(identifier).toHaveProperty('did', LTO_DID)
  expect(identifier).toHaveProperty('controllerKeyId', LTO_KID)
  expect(identifier).toHaveProperty('keys', [{
    kid: LTO_KID,
    kms: 'local',
    type: 'Ed25519',
    publicKeyHex: PUBLIC_KEY_HEX,
  }])
  expect(identifier).toHaveProperty('services', [])
}
