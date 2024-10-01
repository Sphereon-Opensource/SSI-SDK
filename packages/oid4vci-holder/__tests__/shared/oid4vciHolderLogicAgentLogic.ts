import { TAgent } from '@veramo/core'
import { IOID4VCIHolder, SchemaValidation, VerificationResult, verifyCredentialAgainstSchemas } from '../../src'
import { AccessTokenResponse, WellKnownEndpoints } from '@sphereon/oid4vci-common'
import {
  GET_CREDENTIAL_OFFER_AUTHORIZATION_CODE_HTTPS,
  GET_CREDENTIAL_OFFER_PRE_AUTHORIZED_CODE_HTTPS,
  GET_INITIATION_DATA_PRE_AUTHORIZED_OPENID_INITIATE_ISSUANCE,
  GET_PRE_AUTHORIZED_OPENID_CREDENTIAL_OFFER,
  IDENTIPROOF_AS_METADATA,
  IDENTIPROOF_AS_URL,
  IDENTIPROOF_ISSUER_URL,
  IDENTIPROOF_OID4VCI_METADATA,
  WALLET_URL,
} from './MetadataMocks'
import { IMachineStatePersistence } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { CredentialMapper, OriginalVerifiableCredential, WrappedVerifiableCredential } from '@sphereon/ssi-types'
import * as fs from 'fs'
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

function getFile(path: string) {
  return fs.readFileSync(path, 'utf-8')
}

function getFileAsJson(path: string) {
  return JSON.parse(getFile(path))
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

  describe('Credential schema validation', () => {
    const jwtVc: OriginalVerifiableCredential =
      'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL2V4YW1wbGVzL3YxIl0sImlkIjoiaHR0cDovL2V4YW1wbGUuZWR1L2NyZWRlbnRpYWxzLzM3MzIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVW5pdmVyc2l0eURlZ3JlZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiaHR0cHM6Ly9leGFtcGxlLmVkdS9pc3N1ZXJzLzE0IiwiaXNzdWFuY2VEYXRlIjoiMjAxMC0wMS0wMVQxOToyMzoyNFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpleGFtcGxlOmViZmViMWY3MTJlYmM2ZjFjMjc2ZTEyZWMyMSIsImRlZ3JlZSI6eyJ0eXBlIjoiQmFjaGVsb3JEZWdyZWUiLCJuYW1lIjoiQmFjaGVsb3Igb2YgU2NpZW5jZSBhbmQgQXJ0cyJ9fSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vZXhhbXBsZS5vcmcvZXhhbXBsZXMvZGVncmVlLmpzb24iLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifX0sImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5lZHUvaXNzdWVycy8xNCIsIm5iZiI6MTI2MjM3MzgwNCwianRpIjoiaHR0cDovL2V4YW1wbGUuZWR1L2NyZWRlbnRpYWxzLzM3MzIiLCJzdWIiOiJkaWQ6ZXhhbXBsZTplYmZlYjFmNzEyZWJjNmYxYzI3NmUxMmVjMjEifQ.GRJHwxvQfgEOP8TaaBnp2ZCPjFlA_KodpdBupHsRroql10gaE--8oAXR1e-wOuxjFoK-T814h9LKnv71IMI38Q'
    const ldpVc: OriginalVerifiableCredential = getFileAsJson('packages/ssi-types/__tests__/vc_vp_examples/vc/vc_driverLicense.json')
    const ebsiAuthorisationToOnboardVc: OriginalVerifiableCredential =
      'eyJ0eXAiOiJKV1QiLCJraWQiOiIxODNkY2E4NDRiNzM5OGM4MTQ0ZTJiMzk5OWM3MzA2Y2I3OTYzMDJhZWQxNDdkNjY4ZmI2ZmI5YmE0OTZkNTBkIiwiYWxnIjoiRVMyNTZLIn0.eyJpc3N1ZXIiOiJkaWQ6ZWJzaTp6aURuaW94WVlMVzFhM3FVYnFURno0VyIsImlhdCI6MTcxNDQxMzA4OCwianRpIjoidXJuOnV1aWQ6NWZiN2Q5OGItMTA4Yy00YmMwLTlmZmMtYzY5Zjg0ZWQ3ODhmIiwibmJmIjoxNzE0NDEzMDg4LCJleHAiOjE3NDU5NDkwODgsInN1YiI6ImRpZDplYnNpOnpleWJBaUp4elVVcldRMVlNNTFTWTM1IiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwiaWQiOiJ1cm46dXVpZDo1ZmI3ZDk4Yi0xMDhjLTRiYzAtOWZmYy1jNjlmODRlZDc4OGYiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVmVyaWZpYWJsZUF0dGVzdGF0aW9uIiwiVmVyaWZpYWJsZUF1dGhvcmlzYXRpb25Ub09uYm9hcmQiXSwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wNC0yOVQxNzo1MToyOFoiLCJpc3N1ZWQiOiIyMDI0LTA0LTI5VDE3OjUxOjI4WiIsInZhbGlkRnJvbSI6IjIwMjQtMDQtMjlUMTc6NTE6MjhaIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDI1LTA0LTI5VDE3OjUxOjI4WiIsImlzc3VlciI6ImRpZDplYnNpOnppRG5pb3hZWUxXMWEzcVVicVRGejRXIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZWJzaTp6ZXliQWlKeHpVVXJXUTFZTTUxU1kzNSIsImFjY3JlZGl0ZWRGb3IiOltdfSwidGVybXNPZlVzZSI6eyJpZCI6ImRpZDplYnNpOnpleWJBaUp4elVVcldRMVlNNTFTWTM1IiwidHlwZSI6Iklzc3VhbmNlQ2VydGlmaWNhdGUifSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Imh0dHBzOi8vYXBpLXBpbG90LmVic2kuZXUvdHJ1c3RlZC1zY2hlbWFzLXJlZ2lzdHJ5L3YyL3NjaGVtYXMvejNNZ1VGVWtiNzIydXE0eDNkdjV5QUptbk5tekRGZUs1VUM4eDgzUW9lTEpNIiwidHlwZSI6IkZ1bGxKc29uU2NoZW1hVmFsaWRhdG9yMjAyMSJ9fX0.QWNWTWlrbUpLcFJaLVBGczQ0U3Mxb200Mk4yb3JzWndsTXp3REpHTTMxSUM2WG5ZVXJ0ZlY4RHFTbVQtaXBIMEdLSDZhclFEcGtrbXZTTy1NenYxWEE'
    const ebsiKVKRegistrationVc: OriginalVerifiableCredential =
      'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDplYnNpOnptS0M5aW4zY3YzeThEUFNFcURVbkcxIzM2WlJCMlFwUzd3aTBUUWMwQVI0NVM4UXpsS2I5UkdUMXRKUndDNGctakEifQ.eyJpc3MiOiJkaWQ6ZWJzaTp6bUtDOWluM2N2M3k4RFBTRXFEVW5HMSIsInN1YiI6ImRpZDpqd2s6ZXlKcmRIa2lPaUpQUzFBaUxDSmpjbllpT2lKRlpESTFOVEU1SWl3aWEybGtJam9pZGtwa1ZUQlBkRzFUUVZVNFZFMXVhVlJxUzJJMFRVZFdNelJaVG1kaWJHNU5NMHBNTWsxTFpsbFNPQ0lzSW5naU9pSXhVRGRIVjBkc09HRnlWM05SUmkxMFFYUTJXVTlPTFd4TkxVOXZTM0ZLVEc1bFZuSmFURWhWU25sdkluMCIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvZXhhbXBsZXMvdjEiXSwiaWQiOiJ1cm46dXVpZDo4OGU3NWVjOS1lMGUxLTQ0NzEtOWIyNi05ZjJhNTk0MmUxNjAiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiVmVyaWZpYWJsZUF0dGVzdGF0aW9uIiwiS1ZLUmVnaXN0cmF0aW9uIl0sImlzc3VlciI6ImRpZDplYnNpOnptS0M5aW4zY3YzeThEUFNFcURVbkcxIiwiaXNzdWVkIjoiMjAyNC0wOS0xOFQxMjozOToyNy4yODMwOTA3NzVaIiwidmFsaWRGcm9tIjoiMjAyNC0wOS0xOFQxMjozOToyNy4yODMwOTA3NzVaIiwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wOS0xOFQxMjozOToyNy4yODMwOTA3NzVaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6andrOmV5SnJkSGtpT2lKUFMxQWlMQ0pqY25ZaU9pSkZaREkxTlRFNUlpd2lhMmxrSWpvaWRrcGtWVEJQZEcxVFFWVTRWRTF1YVZScVMySTBUVWRXTXpSWlRtZGliRzVOTTBwTU1rMUxabGxTT0NJc0luZ2lPaUl4VURkSFYwZHNPR0Z5VjNOUlJpMTBRWFEyV1U5T0xXeE5MVTl2UzNGS1RHNWxWbkphVEVoVlNubHZJbjAiLCJrdmtOdW1tZXIiOiIyNDEyOTg3NiIsIm5hYW0iOiJEdXRjaENyYWZ0IEZ1cm5pc2hpbmciLCJyZWNodHN2b3JtIjoiQmVzbG90ZW4gVmVubm9vdHNjaGFwIiwic3RhcnRkYXR1bSI6IjIwMjItMDctMDEiLCJlaW5kZGF0dW0iOiIifSwidGVybXNPZlVzZSI6W3siaWQiOiJodHRwczovL2FwaS1waWxvdC5lYnNpLmV1L3RydXN0ZWQtaXNzdWVycy1yZWdpc3RyeS92NS9pc3N1ZXJzL2RpZDplYnNpOnptS0M5aW4zY3YzeThEUFNFcURVbkcxL2F0dHJpYnV0ZXMvZGVhOThhMjIwMTNiMGEyNjgzODNmNWZhZjc4OTJjYjUzMDU4NDI1OGNiOGUzYmZiZTdiMTQ4M2Y3YzY2NjQyMyIsInR5cGUiOiJJc3N1YW5jZUNlcnRpZmljYXRlIn1dLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9hcGktcGlsb3QuZWJzaS5ldS90cnVzdGVkLXNjaGVtYXMtcmVnaXN0cnkvdjMvc2NoZW1hcy8weGQyMjA0NjQ3ODE4ZjljMGM5M2Y2NGI3MGYxYzg5MmVhMmE4ZTBhNzQ3Y2VhYTJmNzczNzNiNDE5OTZiYjc2NGQiLCJ0eXBlIjoiRnVsbEpzb25TY2hlbWFWYWxpZGF0b3IyMDIxIn0sImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL3dhbGxldC5hY2MuY3JlZGVuY28uY29tL2FwaS9zdGF0dXMvZGY4MDNkZDQtMzJjNi00YTY5LWFmZTUtZDgwN2M2NzAxZWQ3LzEjNjY5MDQiLCJ0eXBlIjoiU3RhdHVzTGlzdDIwMjFFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4Ijo2NjkwNCwic3RhdHVzTGlzdENyZWRlbnRpYWwiOiJodHRwczovL3dhbGxldC5hY2MuY3JlZGVuY28uY29tL2FwaS9zdGF0dXMvZGY4MDNkZDQtMzJjNi00YTY5LWFmZTUtZDgwN2M2NzAxZWQ3LzEifX0sImp0aSI6InVybjp1dWlkOjg4ZTc1ZWM5LWUwZTEtNDQ3MS05YjI2LTlmMmE1OTQyZTE2MCIsImlhdCI6MTcyNjY2MzE2NywibmJmIjoxNzI2NjYzMTY3fQ.AnfEichO9BbwyCbNH9wImUMShEc9IWYISMfIDXsnqgyH8GijwlioeS75HyJasNWbFXWvSFfKpOkTqXxOji0GGw'

    const wrappedJwtVc = CredentialMapper.toWrappedVerifiableCredential(jwtVc) as WrappedVerifiableCredential
    const wrappedLdpVc = CredentialMapper.toWrappedVerifiableCredential(ldpVc) as WrappedVerifiableCredential
    const wrappedEbsiVerifiableAuthorisationToOnboard = CredentialMapper.toWrappedVerifiableCredential(
      ebsiAuthorisationToOnboardVc,
    ) as WrappedVerifiableCredential
    const wrappedEbsiKVKRegistrationVc = CredentialMapper.toWrappedVerifiableCredential(ebsiKVKRegistrationVc) as WrappedVerifiableCredential

    it('should validate KVKRegistration ebsi credential against schema', async () => {
      /**
       * the ebsi vc is different from the schema. it has the `einddatum` value as an empty string, while it should be a valid date like: `2024-09-23`
       */
      const resultEbsiVc: VerificationResult = await verifyCredentialAgainstSchemas(wrappedEbsiKVKRegistrationVc, SchemaValidation.WHEN_PRESENT)
      expect(resultEbsiVc.result).toBeFalsy()
    }, 30000)

    it('should validate AuthorisationToOnboard ebsi credential against schema', async () => {
      /**
       * the ebsi vc is different from the schema. The problem is in the proof section. it has a created of number (epoch) but should be a date-string like `2024-04-29T17:51:28Z` also it expects jws and not jwt
       */
      const resultEbsiVc: VerificationResult = await verifyCredentialAgainstSchemas(
        wrappedEbsiVerifiableAuthorisationToOnboard,
        SchemaValidation.WHEN_PRESENT,
      )
      expect(resultEbsiVc.result).toBeFalsy()
    }, 30000)

    it('should not validate jwt VC with dummy schema', async () => {
      const result: VerificationResult = await verifyCredentialAgainstSchemas(wrappedJwtVc, SchemaValidation.WHEN_PRESENT)
      expect(result.result).toBeFalsy()
    }, 30000)

    it('should validate ldp VC without schema', async () => {
      const result: VerificationResult = await verifyCredentialAgainstSchemas(wrappedLdpVc, SchemaValidation.WHEN_PRESENT)
      expect(result.result).toBeTruthy()
    }, 30000)
  })
}
