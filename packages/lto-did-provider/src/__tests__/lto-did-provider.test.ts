import { LtoDidProvider } from '../lto-did-provider'
import { IDidConnectionMode, IRequiredContext } from '../types/lto-provider-types'
import { Network, DIDService, LtoVerificationMethod } from '@sphereon/lto-did-ts'
import { IKeyManager, IKeyManagerCreateArgs, MinimalImportableKey, ManagedKeyInfo, IIdentifier } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'

const PRIVATE_KEY_HEX =
  'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const LTO_DID = 'did:lto:3MzYSqyo8GBMsY8u8F2WEuoVXYuq6hnKzyj'
const LTO_KID = `${LTO_DID}#sign`
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

  it('should create identifier', () => {
    jest.setTimeout(100000)

    // jest.spyOn(fetch, '').mockResolvedValueOnce(Promise.resolve(restResponse));
    const identifier = ltoDIDProvider.createIdentifier(
      {
        options: {
          privateKeyHex: PRIVATE_KEY_HEX,
        },
      },
      mockContext
    )

    expect.assertions(4)
    return assertExpectedIdentifier(identifier)
  })

  it('should create identifier with verificationMethods', async () => {
    jest.setTimeout(100000)

    const identifier = ltoDIDProvider.createIdentifier(
      {
        options: {
          privateKeyHex: PRIVATE_KEY_HEX,
          verificationMethods: [LtoVerificationMethod.VerificationMethod],
        },
      },
      mockContext
    )

    return assertExpectedIdentifier(identifier)
  })

  it('should properly import identifier using DID manager', async () => {
    const importedIdentifier = didManager.didManagerImport(IDENTIFIER, mockContext)
    await assertExpectedIdentifier(importedIdentifier)
    return assertExpectedIdentifier(didManager.didManagerGet({ did: LTO_DID }))
  })

  it('should add verification key', async () => {
    const address = '3MzYSqyo8GBMsY8u8F2WEuoVXYuq6hnKzyj'

    const mockAddVerificationMethod = jest.fn()
    DIDService.prototype.addVerificationMethod = mockAddVerificationMethod
    mockAddVerificationMethod.mockReturnValue(Promise.resolve({ address }))

    await expect(
      ltoDIDProvider.addKey(
        {
          identifier: {
            ...IDENTIFIER,
            services: [],
          },
          key: LTO_KEY,
          options: {
            verificationMethod: LtoVerificationMethod.VerificationMethod,
          },
        },
        mockContext
      )
    ).resolves.toEqual(`did:lto:${address}#sign`)

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
            verificationMethod: LtoVerificationMethod.VerificationMethod,
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
            verificationMethod: LtoVerificationMethod.VerificationMethod,
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
            verificationMethod: LtoVerificationMethod.VerificationMethod,
          },
        },
        mockContext
      )
    ).rejects.toThrow('No private key hex found')
  })
})

async function assertExpectedIdentifier(identifier: Promise<Omit<IIdentifier, 'provider'>>) {
  await expect(identifier).resolves.toHaveProperty('did', LTO_DID)
  await expect(identifier).resolves.toHaveProperty('controllerKeyId', LTO_KID)
  await expect(identifier).resolves.toHaveProperty('keys', [
    {
      kid: LTO_KID,
      kms: 'local',
      type: 'Ed25519',
      publicKeyHex: PUBLIC_KEY_HEX,
    },
  ])
  return expect(identifier).resolves.toHaveProperty('services', [])
}
