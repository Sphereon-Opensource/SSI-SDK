import { TAgent } from '@veramo/core'
import { IOID4VCIHolder } from '../../src'
import { AccessTokenResponse, WellKnownEndpoints } from '@sphereon/oid4vci-common'
import {
  GET_CREDENTIAL_OFFER_AUTHORIZATION_CODE_HTTPS,
  GET_CREDENTIAL_OFFER_PRE_AUTHORIZED_CODE_HTTPS,
  GET_PRE_AUTHORIZED_OPENID_CREDENTIAL_OFFER,
  GET_INITIATION_DATA_PRE_AUTHORIZED_OPENID_INITIATE_ISSUANCE,
  IDENTIPROOF_AS_METADATA,
  IDENTIPROOF_AS_URL,
  IDENTIPROOF_ISSUER_URL,
  IDENTIPROOF_OID4VCI_METADATA,
  WALLET_URL,
} from './MetadataMocks'
import { IMachineStatePersistence } from '@sphereon/ssi-sdk.xstate-machine-persistence'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nock = require('nock')

type ConfiguredAgent = TAgent<IOID4VCIHolder & IMachineStatePersistence>

const mockedAccessTokenResponse: AccessTokenResponse = {
  access_token: 'ey6546.546654.64565',
  authorization_pending: false,
  c_nonce: 'c_nonce2022101300',
  c_nonce_expires_in: 2025101300,
  interval: 2025101300,
  token_type: 'Bearer',
}
const mockedVC =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sImlkIjoiaHR0cDovL2V4YW1wbGUuZWR1L2NyZWRlbnRpYWxzLzM3MzIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVW5pdmVyc2l0eURlZ3JlZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiaHR0cHM6Ly9leGFtcGxlLmVkdS9pc3N1ZXJzLzU2NTA0OSIsImlzc3VhbmNlRGF0ZSI6IjIwMTAtMDEtMDFUMDA6MDA6MDBaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZXhhbXBsZTplYmZlYjFmNzEyZWJjNmYxYzI3NmUxMmVjMjEiLCJkZWdyZWUiOnsidHlwZSI6IkJhY2hlbG9yRGVncmVlIiwibmFtZSI6IkJhY2hlbG9yIG9mIFNjaWVuY2UgYW5kIEFydHMifX19LCJpc3MiOiJodHRwczovL2V4YW1wbGUuZWR1L2lzc3VlcnMvNTY1MDQ5IiwibmJmIjoxMjYyMzA0MDAwLCJqdGkiOiJodHRwOi8vZXhhbXBsZS5lZHUvY3JlZGVudGlhbHMvMzczMiIsInN1YiI6ImRpZDpleGFtcGxlOmViZmViMWY3MTJlYmM2ZjFjMjc2ZTEyZWMyMSJ9.z5vgMTK1nfizNCg5N-niCOL3WUIAL7nXy-nGhDZYO_-PNGeE-0djCpWAMH8fD8eWSID5PfkPBYkx_dfLJnQ7NA'
const INITIATE_QR_PRE_AUTHORIZED =
  'openid-initiate-issuance://?issuer=https%3A%2F%2Fissuer.research.identiproof.io&credential_type=OpenBadgeCredentialUrl&pre-authorized_code=4jLs9xZHEfqcoow0kHE7d1a8hUk6Sy-5bVSV2MqBUGUgiFFQi-ImL62T-FmLIo8hKA1UdMPH0lM1xAgcFkJfxIw9L-lI3mVs0hRT8YVwsEM1ma6N3wzuCdwtMU4bcwKp&user_pin_required=true'
const OFFER_QR_PRE_AUTHORIZED =
  'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22OpenBadgeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D'
const HTTPS_OFFER_QR_AUTHORIZATION_CODE =
  'https://wallet.com?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22OpenBadgeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22eyJhbGciOiJSU0Et...FYUaBy%22%7D%7D%7D'
const HTTPS_OFFER_QR_PRE_AUTHORIZED =
  'https://wallet.com?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.research.identiproof.io%22%2C%22credentials%22%3A%5B%7B%22format%22%3A%22jwt_vc_json%22%2C%22types%22%3A%5B%22VerifiableCredential%22%2C%22OpenBadgeCredential%22%5D%7D%5D%2C%22grants%22%3A%7B%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D'

function succeedWithAFullFlowWithClientSetup() {
  nock(WALLET_URL).get(/.*/).reply(200, {})
  nock(IDENTIPROOF_ISSUER_URL).get('/.well-known/openid-credential-issuer').reply(200, JSON.stringify(IDENTIPROOF_OID4VCI_METADATA))
  nock(IDENTIPROOF_AS_URL).get('/.well-known/oauth-authorization-server').reply(200, JSON.stringify(IDENTIPROOF_AS_METADATA))
  nock(IDENTIPROOF_AS_URL).get(WellKnownEndpoints.OPENID_CONFIGURATION).reply(404, {})
  nock(IDENTIPROOF_AS_URL)
    .post(/oauth2\/token.*/)
    .reply(200, JSON.stringify(mockedAccessTokenResponse))
  nock(IDENTIPROOF_ISSUER_URL)
    .post(/credential/)
    .reply(200, {
      format: 'jwt-vc',
      credential: mockedVC,
    })
}

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }): void => {
  // fixme: Enable these tests. Not sure why the mocks have been butchered from correct values to values that would never work anyway. Made some quick fixes, but needs more work
  describe.skip('OID4VI Holder Agent Plugin', (): void => {
    let agent: ConfiguredAgent

    beforeAll(async (): Promise<void> => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should get initialization data using pre-authorized_code and openid-initiate-issuance draft < 9', async (): Promise<void> => {
      succeedWithAFullFlowWithClientSetup()
      await expect(
        agent.oid4vciHolderStart({
          requestData: {
            uri: INITIATE_QR_PRE_AUTHORIZED,
          },
        }),
      ).resolves.toMatchObject(GET_INITIATION_DATA_PRE_AUTHORIZED_OPENID_INITIATE_ISSUANCE)
    })

    it('should get initialization data using pre-authorized_code and draft 11 >', async (): Promise<void> => {
      succeedWithAFullFlowWithClientSetup()
      await expect(
        agent.oid4vciHolderStart({
          requestData: {
            uri: OFFER_QR_PRE_AUTHORIZED,
          },
        }),
      ).resolves.toMatchObject(GET_PRE_AUTHORIZED_OPENID_CREDENTIAL_OFFER)
    })

    it('should get initialization data using authorization_code and https draft 11 >', async (): Promise<void> => {
      succeedWithAFullFlowWithClientSetup()
      await expect(
        agent.oid4vciHolderStart({
          requestData: {
            uri: HTTPS_OFFER_QR_AUTHORIZATION_CODE,
          },
        }),
      ).resolves.toEqual(GET_CREDENTIAL_OFFER_AUTHORIZATION_CODE_HTTPS)
    })

    it('should get initialization data using pre-authorized_code and https draft 11 >', async (): Promise<void> => {
      succeedWithAFullFlowWithClientSetup()
      await expect(
        agent.oid4vciHolderStart({
          requestData: {
            uri: HTTPS_OFFER_QR_PRE_AUTHORIZED,
          },
        }),
      ).resolves.toEqual(GET_CREDENTIAL_OFFER_PRE_AUTHORIZED_CODE_HTTPS)
    })
  })
}
