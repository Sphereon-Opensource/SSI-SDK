import * as fs from 'fs'
import { IDataStore, TAgent } from '@veramo/core'
import { IPresentationExchange } from '../../src'
import { mapIdentifierKeysToDoc } from '@veramo/utils'
import { mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-did-utils'
import { IPresentationDefinition } from '@sphereon/pex'
import { expect } from '@jest/globals'

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
}

// const nock = require('nock')
jest.mock('@veramo/utils', () => ({
  ...jest.requireActual('@veramo/utils'),
  mapIdentifierKeysToDoc: jest.fn(),
}))

jest.mock('@sphereon/ssi-sdk-did-utils', () => ({
  ...jest.requireActual('@sphereon/ssi-sdk-did-utils'),
  mapIdentifierKeysToDocWithJwkSupport: jest.fn(),
}))

type ConfiguredAgent = TAgent<IPresentationExchange & IDataStore>

// const didMethod = 'ethr'
const did = 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a'
const identifier = {
  did,
  provider: '',
  controllerKeyId: `${did}#controller`,
  keys: [
    {
      kid: `${did}#controller`,
      kms: '',
      type: 'Secp256k1' as const,
      publicKeyHex: '1e21e21e...',
      privateKeyHex: 'eqfcvnqwdnwqn...',
    },
  ],
  services: [],
}
const authKeys = [
  {
    kid: `${did}#controller`,
    kms: '',
    type: 'Secp256k1',
    publicKeyHex: '1e21e21e...',
    privateKeyHex: 'eqfcvnqwdnwqn...',
    meta: {
      verificationMethod: {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: '0xB9C5714089478a327F09197987f16f9E5d936E8a@eip155:1',
        publicKeyHex: '1e21e21e...',
      },
    },
  },
]

console.log(identifier)

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}) => {
  describe('Presentation Exchange Agent Plugin', () => {
    let agent: ConfiguredAgent
    const singleDefinition: IPresentationDefinition = getFileAsJson('./packages/presentation-exchange/__tests__/vc_vp_examples/pd/pd_single.json')
    // const multiDefinition: IPresentationDefinition = getFileAsJson('./packages/presentation-exchange/__tests__/vc_vp_examples/pd/pd_multiple.json')

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()


      const mockedMapIdentifierKeysToDocMethod = mapIdentifierKeysToDoc as jest.Mock
      mockedMapIdentifierKeysToDocMethod.mockReturnValue(Promise.resolve(authKeys))

      const mockedMapIdentifierKeysToDocMethodWithJwkSupport = mapIdentifierKeysToDocWithJwkSupport as jest.Mock
      mockedMapIdentifierKeysToDocMethodWithJwkSupport.mockReturnValue(Promise.resolve(authKeys))

    })

    afterAll(testContext.tearDown)

    it('should store definition', async () => {
      const storeValue = await agent.pexStorePersistDefinition({ definition: singleDefinition })
      expect(storeValue).toBeDefined()
      expect(storeValue.value).toBeDefined()
    })


  })
}
