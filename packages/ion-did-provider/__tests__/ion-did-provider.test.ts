import { createAgent, IKeyManager } from '@veramo/core'
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


describe('@sphereon/ion-did-provider', () => {
  it('should create identifier', async () => {
    jest.setTimeout(100000)

    const identifier = await agent.didManagerCreate({
        options: {
          anchor: false,
          recoveryKey: {
            kid: 'recovery-test'
          },
          updateKey: {
            kid: 'update-test'
          },
          verificationMethods: [
            {
              kid: 'did1-test',
              purposes: [ VerificationRelationship.authentication, VerificationRelationship.assertionMethod]
            },
            {
              kid: 'did2-test',
              purposes: [ VerificationRelationship.keyAgreement]
            }
          ]
        },
      },
    )

    expect(identifier).toBeDefined()
    console.log(JSON.stringify(identifier.did, null, 2))

    console.log(JSON.stringify(await agent.didManagerGet(identifier)), null, 2)
  })
})
