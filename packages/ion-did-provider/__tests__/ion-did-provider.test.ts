import { createAgent, IIdentifier, IKey, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { IonDIDProvider } from '../src'
import { VerificationRelationship } from '../src/types/ion-provider-types'

const ionDIDProvider = new IonDIDProvider({
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
        'did:ion': ionDIDProvider,
      },
      defaultProvider: 'did:ion',
      store: new MemoryDIDStore(),
    }),
  ],
})

jest.setTimeout(1000000)

describe('@sphereon/ion-did-provider', () => {
  it('should create identifier', async () => {
    jest.setTimeout(1000000)

    const identifier: IIdentifier = await agent.didManagerCreate({
      options: {
        anchor: false,
        recoveryKey: {
          kid: 'recovery-test',
        },
        updateKey: {
          kid: 'update-test',
        },
        verificationMethods: [
          {
            kid: 'did1-test',
            purposes: [VerificationRelationship.authentication, VerificationRelationship.assertionMethod],
          },
          {
            kid: 'did2-test',
            purposes: [VerificationRelationship.keyAgreement],
          },
        ],
      },
    })

    expect(identifier).toBeDefined()
    console.log(identifier.did)
    console.log(JSON.stringify(identifier.keys, null, 2))
    expect(identifier.keys.length).toBe(4)

    console.log(JSON.stringify(await agent.didManagerGet(identifier), null, 2))

    expect(identifier.keys[0]).toMatchObject<Partial<IKey>>({
      kms: 'mem',
      kid: 'recovery-test',
      meta: { relation: 'recovery' },
    })

    const newKey = await agent.keyManagerCreate({ kms: 'mem', type: 'Secp256k1' })
    const result = await agent.didManagerAddKey({ did: identifier.did, key: newKey, kid: 'test-add-key' })

    console.log(result)
  })
})
