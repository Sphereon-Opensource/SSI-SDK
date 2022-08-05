import { IKeyManager, IKeyManagerCreateArgs, ManagedKeyInfo, MinimalImportableKey } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { IonDIDProvider } from '../src'
import { IRequiredContext } from '../src/types/ion-provider-types'

/*
const PRIVATE_KEY_HEX =
  'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
*/

// const kms = new KeyManagementSystem(new MemoryPrivateKeyStore())
const memoryDIDStore = new MemoryDIDStore()

const ionDIDProvider = new IonDIDProvider({
  defaultKms: 'local',
})

const didManager = new DIDManager({
  providers: { 'did:ion': ionDIDProvider },
  defaultProvider: 'did:ion',
  store: memoryDIDStore,
})

describe('@sphereon/ion-did-provider', () => {
  const mockContext = {
    agent: {
      keyManagerCreate(_args: IKeyManagerCreateArgs): Promise<ManagedKeyInfo> {
        return Promise.resolve({ publicKeyHex: 'aabbcc', kid: 'testKid2' } as ManagedKeyInfo)
      },
      keyManagerImport(args: MinimalImportableKey): Promise<ManagedKeyInfo> {
        return Promise.resolve({
          publicKeyHex: args.publicKeyHex || 'aabbcc',
          type: args.type,
          kms: args.kms,
          kid: args.kid || 'testKid2',
        })
      },
    } as IKeyManager,
  } as IRequiredContext

  it('should create identifier', async () => {
    jest.setTimeout(100000)

    // jest.spyOn(fetch, '').mockResolvedValueOnce(Promise.resolve(restResponse));
    const identifier = await ionDIDProvider.createIdentifier(
      {
        options: {},
      },
      mockContext
    )

    expect(identifier).toBeDefined()
    if (didManager == null) {
      console.log("nothing")
    }
    // console.log(await didManager.didManagerGet(identifier))
    // expect.assertions(4)
    // return assertExpectedIdentifier(identifier)
  })
})
/*

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
  */
