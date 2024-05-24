import * as fs from 'fs'
import { IDataStore, TAgent } from '@veramo/core'
import { IPresentationExchange } from '../../src'
import { mapIdentifierKeysToDoc } from '@veramo/utils'
import { mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-ext.did-utils'
import { IPresentationDefinition } from '@sphereon/pex'

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

jest.mock('@sphereon/ssi-sdk-ext.did-utils', () => ({
  ...jest.requireActual('@sphereon/ssi-sdk-ext.did-utils'),
  mapIdentifierKeysToDocWithJwkSupport: jest.fn(),
}))

type ConfiguredAgent = TAgent<IPresentationExchange & IDataStore>

// const didMethod = 'ethr'
const did = 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a'
/*const identifier = {
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
}*/
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
export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}) => {
  describe('Presentation Exchange Agent Plugin', () => {
    let agent: ConfiguredAgent
    const singleDefinition: IPresentationDefinition = getFileAsJson('./packages/presentation-exchange/__tests__/fixtures/pd_single.json')
    // const multiDefinition: IPresentationDefinition = getFileAsJson('./packages/presentation-exchange/__tests__/vc_vp_examples/pd/pd_multiple.json')

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      const mockedMapIdentifierKeysToDocMethod = mapIdentifierKeysToDoc as jest.Mock
      mockedMapIdentifierKeysToDocMethod.mockReturnValue(Promise.resolve(authKeys))

      const mockedMapIdentifierKeysToDocMethodWithJwkSupport = mapIdentifierKeysToDocWithJwkSupport as jest.Mock
      mockedMapIdentifierKeysToDocMethodWithJwkSupport.mockReturnValue(Promise.resolve(authKeys))
    })

    /*  afterEach(async () => {
      await agent.pexStoreClearDefinitions()
    })*/

    afterAll(testContext.tearDown)

    it('should store valid definition', async () => {
      const pd = await agent.pexStorePersistDefinition({ definition: singleDefinition })
      expect(pd).toBeDefined()
      expect(pd.input_descriptors).toBeDefined()
      await expect(agent.pexStoreHasDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(true)
    })

    it('should not store invalid definition by default', async () => {
      await expect(agent.pexStorePersistDefinition({ definition: { invalid: 'definition' } as unknown as IPresentationDefinition })).rejects.toThrow(
        'Invalid definition. This is not a valid PresentationDefinition',
      )
    })

    it('should not store invalid definition if validation is enabled', async () => {
      await expect(
        agent.pexStorePersistDefinition({ validation: true, definition: { invalid: 'definition' } as unknown as IPresentationDefinition }),
      ).rejects.toThrow('Invalid definition. This is not a valid PresentationDefinition')
    })

    it('should store invalid definition if validation is disabled', async () => {
      const pd = await agent.pexStorePersistDefinition({
        validation: false,
        definition: { invalid: 'definition' } as unknown as IPresentationDefinition,
      })
      expect(pd).toBeDefined()
      expect(pd.input_descriptors).toBeDefined()
      await expect(agent.pexStoreHasDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(true)
    })

    it('should get definition', async () => {
      await agent.pexStorePersistDefinition({ definition: singleDefinition })
      await expect(agent.pexStoreGetDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(singleDefinition)
    })

    it('should remove definition', async () => {
      await agent.pexStorePersistDefinition({ definition: singleDefinition })
      await expect(agent.pexStoreHasDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(true)
      await expect(agent.pexStoreRemoveDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(true)
      await expect(agent.pexStoreHasDefinition({ definitionId: singleDefinition.id })).resolves.toEqual(false)
    })

    it('should clear definitions', async () => {
      await agent.pexStorePersistDefinition({ definitionId: 'c1', definition: singleDefinition })
      await agent.pexStorePersistDefinition({ definitionId: 'c2', definition: singleDefinition })
      await agent.pexStorePersistDefinition({ definitionId: 'c3', definition: singleDefinition })
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c1' })).resolves.toEqual(true)
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c2' })).resolves.toEqual(true)
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c3' })).resolves.toEqual(true)
      await agent.pexStoreClearDefinitions()
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c1' })).resolves.toEqual(false)
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c2' })).resolves.toEqual(false)
      await expect(agent.pexStoreHasDefinition({ definitionId: 'c3' })).resolves.toEqual(false)
    })
  })
}
