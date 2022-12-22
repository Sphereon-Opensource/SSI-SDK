import { TAgent } from '@veramo/core'
import { OP } from '@sphereon/did-auth-siop'
import { IDidAuthSiopOpAuthenticator } from '../../src'

import {
  ResponseContext,
  ResponseMode,
  ResponseType,
  SubjectIdentifierType,
  UrlEncodingFormat,
  VerificationMode,
  VerifiedAuthorizationRequest,
  ParsedAuthorizationRequestURI
} from '@sphereon/did-auth-siop'
import { mapIdentifierKeysToDoc } from '@veramo/utils'
import { pdMultiple, pdSingle, vcs, vpMultiple, vpSingle } from './mockedData'

const nock = require('nock')
jest.mock('@veramo/utils', () => ({
  ...jest.requireActual('@veramo/utils'),
  mapIdentifierKeysToDoc: jest.fn(),
}))

type ConfiguredAgent = TAgent<IDidAuthSiopOpAuthenticator>

const didMethod = 'ethr'
const did = 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a'
const identifier = {
  did,
  provider: '',
  controllerKeyId: `${did}#controller`,
  keys: [
    {
      kid: `${did}#controller`,
      kms: '',
      type: 'Ed25519' as const,
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
    type: 'Ed25519',
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
const sessionId = 'sessionId'
const otherSessionId = 'other_sessionId'
const redirectUrl = 'http://example/ext/get-auth-request-url'
const stateId = '2hAyTM7PB3SGJaeGU7QeTJ'
const nonce = 'o5qwML7DnrcLMs9Vdizyz9'
const scope = 'openid'
const requestResultMockedText =
  'openid://?response_type=id_token' +
  '&scope=openid' +
  '&client_id=' +
  did +
  '&redirect_uri=' +
  redirectUrl +
  '&iss=' +
  did +
  '&response_mode=post' +
  '&response_context=rp' +
  '&nonce=' +
  nonce +
  '&state=' +
  stateId +
  '&registration=registration_value' +
  '&request=ey...'
const registration = {
  did_methods_supported: [`did:${didMethod}:`],
  subject_identifiers_supported: SubjectIdentifierType.DID,
  credential_formats_supported: [],
}
const authenticationRequest: ParsedAuthorizationRequestURI = {
  encodedUri: 'uri_example',
  encodingFormat: UrlEncodingFormat.FORM_URL_ENCODED,
  scheme: 'scheme2022122200',
  requestObjectJwt: 'ey...',
  authorizationRequestPayload: {
    response_type: ResponseType.ID_TOKEN,
    scope,
    client_id: did,
    redirect_uri: redirectUrl,
    iss: did,
    response_mode: ResponseMode.POST,
    response_context: ResponseContext.RP,
    nonce,
    stateId,
    registration,
    request: 'ey...',
  },
  registration,
}
const authenticationVerificationMockedResult = {
  payload: {},
  verifyOpts: {},
}

const createAuthorizationResponseMockedResult: VerifiedAuthorizationRequest = {
  didResolutionResult: {
    didResolutionMetadata: {},
    didDocument: {
      id: did,
    },
    didDocumentMetadata: {},
  },
  issuer: did,
  signer: {
    id: did,
    type: 'authentication',
    controller: did,
  },
  jwt: 'ey...',
  authorizationRequestPayload: {
    scope,
    response_type: ResponseType.ID_TOKEN,
    client_id: did,
    redirect_uri: redirectUrl,
    response_mode: ResponseMode.POST,
    response_context: ResponseContext.RP,
    nonce: nonce,
  },
  verifyOpts: {
    verification: {
      mode: VerificationMode.INTERNAL,
      resolveOpts: {},
    },
  },
  authorizationRequest: null,
  versions: [],
  payload: undefined
}

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}) => {
  describe('DID Auth SIOP OP Authenticator Agent Plugin', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()

      nock(redirectUrl).get(`?stateId=${stateId}`).times(5).reply(200, requestResultMockedText)

      const mockedMapIdentifierKeysToDocMethod = mapIdentifierKeysToDoc as jest.Mock
      mockedMapIdentifierKeysToDocMethod.mockReturnValue(Promise.resolve(authKeys))

      const mockedparseAuthorizationRequestURIMethod = jest.fn()
      OP.prototype.parseAuthorizationRequestURI = mockedparseAuthorizationRequestURIMethod
      mockedparseAuthorizationRequestURIMethod.mockReturnValue(Promise.resolve(authenticationRequest))

      const mockedverifyAuthorizationRequestMethod = jest.fn()
      OP.prototype.verifyAuthorizationRequest = mockedverifyAuthorizationRequestMethod
      mockedverifyAuthorizationRequestMethod.mockReturnValue(Promise.resolve(authenticationVerificationMockedResult))

      const mockedcreateAuthorizationResponse = jest.fn()
      OP.prototype.createAuthorizationResponse = mockedcreateAuthorizationResponse
      mockedcreateAuthorizationResponse.mockReturnValue(Promise.resolve(createAuthorizationResponseMockedResult))

      const mocksubmitAuthorizationResponseMethod = jest.fn()
      OP.prototype.submitAuthorizationResponse = mocksubmitAuthorizationResponseMethod
      mocksubmitAuthorizationResponseMethod.mockReturnValue(Promise.resolve({ status: 200, statusText: 'example_value' }))

      await agent.registerSessionForSiop({
        sessionId,
        identifier,
      })
    })

    afterAll(testContext.tearDown)

    it('should register OP session', async () => {
      const sessionId = 'new_session_id'
      const result = await agent.registerSessionForSiop({
        sessionId,
        identifier,
      })

      expect(result.id).toEqual(sessionId)
    })

    it('should remove OP session', async () => {
      await agent.registerSessionForSiop({
        sessionId: otherSessionId,
        identifier,
      })
      await agent.removeSessionForSiop({
        sessionId: otherSessionId,
      })

      await expect(
        agent.getSessionForSiop({
          sessionId: otherSessionId,
        })
      ).rejects.toThrow(`No session found for id: ${otherSessionId}`)
    })

    if (!testContext.isRestTest) {
      it('should register custom approval function', async () => {
        await expect(
          agent.registerCustomApprovalForSiop({
            key: 'test_register',
            customApproval: (verifiedAuthenticationRequest: VerifiedAuthorizationRequest) => Promise.resolve(),
          })
        ).resolves.not.toThrow()
      })

      it('should remove custom approval function', async () => {
        await agent.registerCustomApprovalForSiop({
          key: 'test_delete',
          customApproval: (verifiedAuthenticationRequest: VerifiedAuthorizationRequest) => Promise.resolve(),
        })
        const result = await agent.removeCustomApprovalForSiop({
          key: 'test_delete',
        })

        expect(result).toEqual(true)
      })
    }

    it('should authenticate with DID SIOP without custom approval', async () => {
      const result = await agent.authenticateWithSiop({
        sessionId,
        stateId,
        redirectUrl,
      })

      expect(result.status).toEqual(200)
    })

    it('should authenticate with DID SIOP with custom approval', async () => {
      const result = await agent.authenticateWithSiop({
        sessionId,
        stateId,
        redirectUrl,
        customApproval: testContext.isRestTest
          ? 'success'
          : (verifiedAuthenticationRequest: VerifiedAuthorizationRequest) => {
              return Promise.resolve()
            },
      })

      expect(result.status).toEqual(200)
    })

    it('should not authenticate with DID SIOP with unknown custom approval key', async () => {
      const customApprovalKey = 'some_random_key'
      await expect(
        agent.authenticateWithSiop({
          sessionId,
          stateId,
          redirectUrl,
          customApproval: customApprovalKey,
        })
      ).rejects.toThrow(`Custom approval not found for key: ${customApprovalKey}`)
    })

    it('should not authenticate with DID SIOP when custom approval fails', async () => {
      const denied = 'denied'
      await expect(
        agent.authenticateWithSiop({
          sessionId,
          stateId,
          redirectUrl,
          customApproval: testContext.isRestTest
            ? 'failure'
            : (verifiedAuthenticationRequest: VerifiedAuthorizationRequest) => {
                return Promise.reject(new Error(denied))
              },
        })
      ).rejects.toThrow(denied)
    })

    it('should get authenticate request from RP', async () => {
      const result = await agent.getSiopAuthenticationRequestFromRP({
        sessionId,
        stateId,
        redirectUrl,
      })

      expect(result).toEqual(authenticationRequest)
    })

    it('should get authentication details with single credential', async () => {
      const result = await agent.getSiopAuthenticationRequestDetails({
        sessionId,
        verifiedAuthorizationRequest: {
          ...createAuthorizationResponseMockedResult,
          presentationDefinitions: pdSingle,
        },
        verifiableCredentials: vcs,
      })

      expect(result).toEqual({
        id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
        vpResponseOpts: vpSingle,
      })
    })

    it('should get authentication details with multiple credentials', async () => {
      const result = await agent.getSiopAuthenticationRequestDetails({
        sessionId,
        verifiedAuthorizationRequest: {
          ...createAuthorizationResponseMockedResult,
          presentationDefinitions: pdMultiple,
        },
        verifiableCredentials: vcs,
      })

      expect(result).toEqual({
        alsoKnownAs: undefined,
        id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
        vpResponseOpts: vpMultiple,
      })
    })

    it('should verify authentication request URI with did methods supported provided', async () => {
      authenticationRequest.registration.did_methods_supported = [`did:${didMethod}:`]

      const result = await agent.verifySiopAuthorizationRequestURI({
        sessionId,
        requestURI: authenticationRequest,
      })

      expect(result).toEqual(authenticationVerificationMockedResult)
    })

    it('should verify authentication request URI without did methods supported provided', async () => {
      authenticationRequest.registration.did_methods_supported = []

      const result = await agent.verifySiopAuthorizationRequestURI({
        sessionId,
        requestURI: authenticationRequest,
      })

      expect(result).toEqual(authenticationVerificationMockedResult)
    })

    it('should send authentication response', async () => {
      const result = await agent.sendSiopAuthorizationResponse({
        sessionId,
        verifiedAuthorizationRequest: createAuthorizationResponseMockedResult,
      })

      expect(result.status).toEqual(200)
    })
  })
}
