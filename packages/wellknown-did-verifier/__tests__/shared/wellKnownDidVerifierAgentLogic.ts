import { ValidationStatusEnum } from '@sphereon/wellknown-dids-client'
import { TAgent, IResolver } from '@veramo/core'
import { IWellKnownDidVerifier } from '../../src'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const nock = require('nock')

type ConfiguredAgent = TAgent<IWellKnownDidVerifier | IResolver>

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}) => {
  describe('Well-Known DID Verifier Agent Plugin', () => {
    const DID = 'did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM'
    const DID_CONFIGURATION = {
      '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
      linked_dids: [
        'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNI3o2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSJ9.eyJleHAiOjE3NjQ4NzkxMzksImlzcyI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNIiwibmJmIjoxNjA3MTEyNzM5LCJzdWIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2RpZC1jb25maWd1cmF0aW9uL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rb1RIc2dOTnJieThKekNOUTFpUkx5VzVRUTZSOFh1dTZBQThpZ0dyTVZQVU0iLCJvcmlnaW4iOiJodHRwczovL2lkZW50aXR5LmZvdW5kYXRpb24ifSwiZXhwaXJhdGlvbkRhdGUiOiIyMDI1LTEyLTA0VDE0OjEyOjE5LTA2OjAwIiwiaXNzdWFuY2VEYXRlIjoiMjAyMC0xMi0wNFQxNDoxMjoxOS0wNjowMCIsImlzc3VlciI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNIiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRvbWFpbkxpbmthZ2VDcmVkZW50aWFsIl19fQ.YZnpPMAW3GdaPXC2YKoJ7Igt1OaVZKq09XZBkptyhxTAyHTkX2Ewtew-JKHKQjyDyabY3HAy1LUPoIQX0jrU0J82pIYT3k2o7nNTdLbxlgb49FcDn4czntt5SbY0m1XwrMaKEvV0bHQsYPxNTqjYsyySccgPfmvN9IT8gRS-M9a6MZQxuB3oEMrVOQ5Vco0bvTODXAdCTHibAk1FlvKz0r1vO5QMhtW4OlRrVTI7ibquf9Nim_ch0KeMMThFjsBDKetuDF71nUcL5sf7PCFErvl8ZVw3UK4NkZ6iM-XIRsLL6rXP2SnDUVovcldhxd_pyKEYviMHBOgBdoNP6fOgRQ',
        'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNI3o2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSJ9.eyJleHAiOjE3NjQ4NzkxMzksImlzcyI6ImRpZDprZXk6b3RoZXIiLCJuYmYiOjE2MDcxMTI3MzksInN1YiI6ImRpZDprZXk6b3RoZXIiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vaWRlbnRpdHkuZm91bmRhdGlvbi8ud2VsbC1rbm93bi9kaWQtY29uZmlndXJhdGlvbi92MSJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDprZXk6b3RoZXIiLCJvcmlnaW4iOiJodHRwczovL2lkZW50aXR5LmZvdW5kYXRpb24ifSwiZXhwaXJhdGlvbkRhdGUiOiIyMDI1LTEyLTA0VDE0OjEyOjE5LTA2OjAwIiwiaXNzdWFuY2VEYXRlIjoiMjAyMC0xMi0wNFQxNDoxMjoxOS0wNjowMCIsImlzc3VlciI6ImRpZDprZXk6b3RoZXIiLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRG9tYWluTGlua2FnZUNyZWRlbnRpYWwiXX19.rRuc-ojuEgyq8p_tBYK7BayuiNTBeXNyAnC14Rnjs-jsnhae4_E1Q12W99K2NGCGBi5KjNsBcZmdNJPxejiKPrjjcB99poFCgTY8tuRzDjVo0lIeBwfx9qqjKHTRTUR8FGM_imlOpVfBF4AHYxjkHvZn6c9lYvatYcDpB2UfH4BNXkdSVrUXy_kYjpMpAdRtyCAnD_isN1YpEHBqBmnfuVUbYcQK5kk6eiokRFDtWruL1OEeJMYPqjuBSd2m-H54tSM84Oic_pg2zXDjjBlXNelat6MPNT2QxmkwJg7oyewQWX2Ot2yyhSp9WyAQWMlQIe2x84R0lADUmZ1TPQchNw',
      ],
    }

    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should verify domain linkage with signature verification key', async () => {
      nock('https://example.com').get('/.well-known/did-configuration.json').times(3).reply(200, DID_CONFIGURATION)

      const result = await agent.verifyDomainLinkage({
        did: DID,
        signatureVerification: 'verified',
      })

      expect(result.status).toEqual(ValidationStatusEnum.VALID)
    })

    it('should only verify service DIDs when onlyVerifyServiceDids set to true', async () => {
      nock('https://example.com').get('/.well-known/did-configuration.json').times(3).reply(200, DID_CONFIGURATION)

      const result = await agent.verifyDomainLinkage({
        did: DID,
        signatureVerification: 'verified',
        onlyVerifyServiceDids: true,
      })

      expect(result.endpointDescriptors[0].resources[0].credentials.length).toEqual(1)
    })

    it('should throw error if signature verification key is not found when verifying a domain linkage', async () => {
      const signatureVerificationKey = 'unknown'
      await expect(
        agent.verifyDomainLinkage({
          did: DID,
          signatureVerification: signatureVerificationKey,
        }),
      ).rejects.toThrow(`Signature validation not found for key: ${signatureVerificationKey}`)
    })

    it('should throw error if signature verification key is not found when verifying a DID configuration resource', async () => {
      const signatureVerificationKey = 'unknown'

      await expect(
        agent.verifyDidConfigurationResource({
          signatureVerification: signatureVerificationKey,
          origin: 'https://example.com',
        }),
      ).rejects.toThrow(`Signature validation not found for key: ${signatureVerificationKey}`)
    })

    it('should throw error if no configuration or origin is supplied', async () => {
      await expect(
        agent.verifyDidConfigurationResource({
          signatureVerification: 'verified',
        }),
      ).rejects.toThrow('No DID configuration resource or origin supplied.')
    })

    it('should throw error if both configuration and origin are supplied', async () => {
      await expect(
        agent.verifyDidConfigurationResource({
          signatureVerification: 'verified',
          configuration: DID_CONFIGURATION,
          origin: 'https://example.com',
        }),
      ).rejects.toThrow('Cannot supply both a DID configuration resource and an origin.')
    })

    it('should verify DID configuration resource with signature verification key', async () => {
      nock('https://example.com').get('/.well-known/did-configuration.json').times(1).reply(200, DID_CONFIGURATION)

      const result = await agent.verifyDidConfigurationResource({
        signatureVerification: 'verified',
        origin: 'https://example.com',
      })

      expect(result.status).toEqual(ValidationStatusEnum.VALID)
    })

    it('should only verify specific DID when given', async () => {
      nock('https://example.com').get('/.well-known/did-configuration.json').times(1).reply(200, DID_CONFIGURATION)

      const result = await agent.verifyDidConfigurationResource({
        did: DID,
        signatureVerification: 'verified',
        origin: 'https://example.com',
      })

      expect(result.credentials.length).toEqual(1)
    })

    if (!testContext.isRestTest) {
      it('should verify domain linkage with signature verification callback', async () => {
        nock('https://example.com').get('/.well-known/did-configuration.json').times(3).reply(200, DID_CONFIGURATION)

        const result = await agent.verifyDomainLinkage({
          did: DID,
          signatureVerification: () => Promise.resolve({ verified: true }),
        })

        expect(result.status).toEqual(ValidationStatusEnum.VALID)
      })

      it('should register signature verification', async () => {
        const callbackName = 'new'
        await agent.registerSignatureVerification({
          callbackName,
          signatureVerification: () => Promise.resolve({ verified: true }),
        })

        await expect(
          agent.registerSignatureVerification({
            callbackName,
            signatureVerification: () => Promise.resolve({ verified: true }),
          }),
        ).rejects.toThrow(`Signature validation with key: ${callbackName} already present`)
      })

      it('should remove signature verification', async () => {
        const callbackName = 'remove'
        await agent.registerSignatureVerification({
          callbackName,
          signatureVerification: () => Promise.resolve({ verified: true }),
        })

        const result = await agent.removeSignatureVerification({ callbackName })

        expect(result).toEqual(true)
      })

      it('should verify DID configuration resource with signature verification callback', async () => {
        nock('https://example.com').get('/.well-known/did-configuration.json').times(1).reply(200, DID_CONFIGURATION)

        const result = await agent.verifyDidConfigurationResource({
          signatureVerification: () => Promise.resolve({ verified: true }),
          origin: 'https://example.com',
        })

        expect(result.status).toEqual(ValidationStatusEnum.VALID)
      })
    }
  })
}
