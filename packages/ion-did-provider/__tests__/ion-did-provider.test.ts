import { createAgent, IIdentifier, IKey, IKeyManager } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'
import { KeyManagementSystem } from '@veramo/kms-local'
import { IonDIDProvider } from '../src'

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

// console.log(generatePrivateKeyHex(KeyType.Secp256k1))

const PRIVATE_RECOVERY_KEY_HEX = '7c90c0575643d09a370c35021c91e9d8af2c968c5f3a4bf73802693511a55b9f'
const PRIVATE_UPDATE_KEY_HEX = '7288a92f6219c873446abd1f8d26fcbbe1caa5274b47f6f086ef3e7e75dcad8b'
const PRIVATE_DID_KEY_HEX = '06eb9e64569203679b36f834a4d9725c989d32a7fb52c341eae3517b3aff8ee6'
// const PRIVATE_DID_ADD_KEY1_HEX = '42f5d6cbb8af0b484453e19193b6d89e814f1ce66d2c1428271c94ff5465d627'
// const PRIVATE_DID_ADD_KEY2_HEX = 'abebf433281c5bb86ff8a271d2a464e528437041322a58fb8c14815763cfc189'

jest.setTimeout(100000000)

describe('@sphereon/ion-did-provider', () => {
  it('should create identifier', async () => {
    jest.setTimeout(100000000)

    const anchor = true
    const identifier: IIdentifier = await agent.didManagerCreate({
      options: {
        anchor,
        recoveryKey: {
          kid: 'recovery-test',
        },
        updateKey: {
          kid: 'update-test',
        },
        verificationMethods: [
          {
            kid: 'did1-test',
            purposes: [IonPublicKeyPurpose.Authentication, IonPublicKeyPurpose.AssertionMethod],
          },
          {
            kid: 'did2-test',
            purposes: [IonPublicKeyPurpose.KeyAgreement],
          },
        ],
      },
    })

    expect(identifier).toBeDefined()
    console.log(identifier.did)
    console.log(identifier.alias)
    // console.log(JSON.stringify(identifier.keys, null, 2))
    expect(identifier.keys.length).toBe(4)

    console.log(JSON.stringify(await agent.didManagerGet(identifier), null, 2))

    expect(identifier.keys[0]).toMatchObject<Partial<IKey>>({
      kms: 'mem',
      kid: 'recovery-test',
      meta: { ion: { relation: 'recovery' } },
    })

    /*

    const newKey = await agent.keyManagerCreate({ kms: 'mem', type: 'Secp256k1' })
    const result = await agent.didManagerAddKey({
      did: identifier.did,
      key: newKey,
      kid: 'test-add-key',
      options: { anchor },
    })

    console.log(result)

*/
  })
  it('should add key', async () => {
    // This DID is known in ION, hence no anchoring
    const identifier: IIdentifier = await agent.didManagerCreate({
      options: {
        anchor: false,
        recoveryKey: {
          kid: 'recovery-test2',
          key: {
            privateKeyHex: PRIVATE_RECOVERY_KEY_HEX,
          },
        },
        updateKey: {
          kid: 'update-test2',
          key: {
            privateKeyHex: PRIVATE_UPDATE_KEY_HEX,
          },
        },
        verificationMethods: [
          {
            kid: 'did1-test2',
            purposes: [IonPublicKeyPurpose.Authentication, IonPublicKeyPurpose.AssertionMethod],
            key: {
              privateKeyHex: PRIVATE_DID_KEY_HEX,
            },
          },
        ],
      },
    })
    expect(identifier.alias).toEqual('did:ion:EiCprjAMfWpp7zYXDZV2TGNDV6U4AEBN2Jr6sVsuzL7qhA')
    expect(identifier.did).toEqual(
      'did:ion:EiCprjAMfWpp7zYXDZV2TGNDV6U4AEBN2Jr6sVsuzL7qhA:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJkaWQxLXRlc3QyIiwicHVibGljS2V5SndrIjp7ImNydiI6InNlY3AyNTZrMSIsImt0eSI6IkVDIiwieCI6ImFNak5DV01kZVhKUmczUER6RTdURTlQMnhGcG9MOWZSa0owdG9WQk1COEUiLCJ5IjoiUXo3dmowelVqNlM0ZGFHSXVFTWJCX1VhNlE2d09UR0FvNDZ0WExpM1N4RSJ9LCJwdXJwb3NlcyI6WyJhdXRoZW50aWNhdGlvbiIsImFzc2VydGlvbk1ldGhvZCJdLCJ0eXBlIjoiRWNkc2FTZWNwMjU2azFWZXJpZmljYXRpb25LZXkyMDE5In1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlCenA3WWhOOW1oVWNac0ZkeG5mLWx3a1JVLWhWYkJ0WldzVm9KSFY2amt3QSJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpRDl4NFJOekEtRGRpRHJUMGd1UU9vLXAwWDh2RTRNcUpvcEVTelZ2ZUtEQnciLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaURBUVhTaTdIY2pKVkJZQUtkTzJ6ck00SGZ5Ym1CQkNXc2w2UFFQSl9qa2xBIn19'
    )

    const newKey = await agent.keyManagerCreate({ kms: 'mem', type: 'Secp256k1' })
    const result = await agent.didManagerAddKey({
      did: identifier.did,
      key: newKey,
      kid: 'test-add-key-' + Date.now(),
      options: { purposes: [IonPublicKeyPurpose.AssertionMethod, IonPublicKeyPurpose.Authentication] },
    })

    console.log(result)
  })
})
