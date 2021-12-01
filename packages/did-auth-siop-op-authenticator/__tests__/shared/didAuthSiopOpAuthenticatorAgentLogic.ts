import { TAgent } from '@veramo/core'
import { OP, PresentationExchange } from '@sphereon/did-auth-siop/dist/main'
import { IDidAuthSiopOpAuthenticator } from '../../src/types/IDidAuthSiopOpAuthenticator'
import {
  ResponseContext,
  ResponseMode,
  ResponseType,
  SubjectIdentifierType,
  UrlEncodingFormat,
  VerificationMode,
  VerifiedAuthenticationRequestWithJWT,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'

const nock = require('nock')

type ConfiguredAgent = TAgent<IDidAuthSiopOpAuthenticator>

const didMethod = 'ethr'
const did = `did:${didMethod}:0xcBe71d18b5F1259faA9fEE8f9a5FAbe2372BE8c9`
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
const authenticationRequest = {
  encodedUri: 'uri_example',
  encodingFormat: UrlEncodingFormat.FORM_URL_ENCODED,
  jwt: 'ey...',
  requestPayload: {
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
const createAuthenticationResponseMockedResult = {
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
  payload: {
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
}

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  runAuthenticateWithCustomApprovalTest: boolean
}) => {
  describe('DID Auth SIOP OP Authenticator Agent Plugin', () => {
    let agent: ConfiguredAgent

    beforeAll(() => {
      testContext.setup()
      agent = testContext.getAgent()

      nock(redirectUrl).get(`?stateId=${stateId}`).times(4).reply(200, requestResultMockedText)

      const mockedParseAuthenticationRequestURIMethod = jest.fn()
      OP.prototype.parseAuthenticationRequestURI = mockedParseAuthenticationRequestURIMethod
      mockedParseAuthenticationRequestURIMethod.mockReturnValue(Promise.resolve(authenticationRequest))

      const mockedVerifyAuthenticationRequestMethod = jest.fn()
      OP.prototype.verifyAuthenticationRequest = mockedVerifyAuthenticationRequestMethod
      mockedVerifyAuthenticationRequestMethod.mockReturnValue(Promise.resolve(authenticationVerificationMockedResult))

      const mockedCreateAuthenticationResponse = jest.fn()
      OP.prototype.createAuthenticationResponse = mockedCreateAuthenticationResponse
      mockedCreateAuthenticationResponse.mockReturnValue(Promise.resolve(createAuthenticationResponseMockedResult))

      const mockSubmitAuthenticationResponseMethod = jest.fn()
      OP.prototype.submitAuthenticationResponse = mockSubmitAuthenticationResponseMethod
      mockSubmitAuthenticationResponseMethod.mockReturnValue(Promise.resolve({ status: 200, statusText: 'example_value' }))

      const mockedSelectVerifiableCredentialsForSubmissionMethod = jest.fn()
      PresentationExchange.prototype.selectVerifiableCredentialsForSubmission = mockedSelectVerifiableCredentialsForSubmissionMethod
      mockedSelectVerifiableCredentialsForSubmissionMethod.mockReturnValue(Promise.resolve({ errors: [], matches: ['match'] }))

      const mockedSubmissionFromMethod = jest.fn()
      PresentationExchange.prototype.submissionFrom = mockedSubmissionFromMethod
      mockedSubmissionFromMethod.mockReturnValue(Promise.resolve({}))
    })

    afterAll(testContext.tearDown)

    it('should authentication with DID SIOP without custom approval', async () => {
      const result = await agent.authenticateWithDidSiop({
        stateId,
        redirectUrl,
        didMethod,
      })

      expect(result.status).toEqual(200)
    })

    it('should authentication with DID SIOP with custom approval', async () => {
      const result = await agent.authenticateWithDidSiop({
        stateId,
        redirectUrl,
        didMethod,
        customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => {
          return Promise.resolve()
        },
      })

      expect(result.status).toEqual(200)
    })

    if (testContext.runAuthenticateWithCustomApprovalTest) {
      it('should not authentication with DID SIOP when custom approval fails', async () => {
        await expect(
          agent.authenticateWithDidSiop({
            stateId,
            redirectUrl,
            didMethod,
            customApproval: (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => {
              return Promise.reject(new Error('Denied'))
            },
          })
        ).rejects.toThrow('Denied')
      })
    }

    it('should get authentication request from RP', async () => {
      const result = await agent.getDidSiopAuthenticationRequestFromRP({
        stateId,
        redirectUrl,
      })

      expect(result).toEqual(authenticationRequest)
    })

    it('should get authentication details', async () => {
      const result = await agent.getDidSiopAuthenticationRequestDetails({
        verifiedAuthenticationRequest: createAuthenticationResponseMockedResult,
        verifiableCredentials: [],
      })

      expect(result.id).toEqual(did)
    })

    it('should verify authentication request URI with did methods supported provided', async () => {
      authenticationRequest.registration.did_methods_supported = [`did:${didMethod}:`]

      const result = await agent.verifyDidSiopAuthenticationRequestURI({
        requestURI: authenticationRequest,
      })

      expect(result).toEqual(authenticationVerificationMockedResult)
    })

    it('should verify authentication request URI without did methods supported provided', async () => {
      authenticationRequest.registration.did_methods_supported = []

      const result = await agent.verifyDidSiopAuthenticationRequestURI({
        requestURI: authenticationRequest,
        didMethod,
      })

      expect(result).toEqual(authenticationVerificationMockedResult)
    })

    it('should send authentication response', async () => {
      const result = await agent.sendDidSiopAuthenticationResponse({
        verifiedAuthenticationRequest: createAuthenticationResponseMockedResult,
      })

      expect(result.status).toEqual(200)
    })
  })
}
