import { ProofFormatTypesEnum } from '@sphereon/wellknown-dids-client'
import { TAgent, IDIDManager } from '@veramo/core'
import { IWellKnownDidIssuer } from '../../src'

type ConfiguredAgent = TAgent<IWellKnownDidIssuer | IDIDManager>

export default (testContext: {
  getAgent: () => ConfiguredAgent
  setup: () => Promise<boolean>
  tearDown: () => Promise<boolean>
  isRestTest: boolean
}) => {
  describe('Well-Known DID Issuer Agent Plugin', () => {
    const DID = 'did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM'
    const ORIGIN = 'https://example.com'
    const COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL =
      'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNI3o2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSJ9.eyJleHAiOjE3NjQ4NzkxMzksImlzcyI6ImRpZDprZXk6ejZNa29USHNnTk5yYnk4SnpDTlExaVJMeVc1UVE2UjhYdXU2QUE4aWdHck1WUFVNIiwibmJmIjoxNjA3MTEyNzM5LCJzdWIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2RpZC1jb25maWd1cmF0aW9uL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImlkIjoiZGlkOmtleTp6Nk1rb1RIc2dOTnJieThKekNOUTFpUkx5VzVRUTZSOFh1dTZBQThpZ0dyTVZQVU0iLCJvcmlnaW4iOiJpZGVudGl0eS5mb3VuZGF0aW9uIn0sImV4cGlyYXRpb25EYXRlIjoiMjAyNS0xMi0wNFQxNDoxMjoxOS0wNjowMCIsImlzc3VhbmNlRGF0ZSI6IjIwMjAtMTItMDRUMTQ6MTI6MTktMDY6MDAiLCJpc3N1ZXIiOiJkaWQ6a2V5Ono2TWtvVEhzZ05OcmJ5OEp6Q05RMWlSTHlXNVFRNlI4WHV1NkFBOGlnR3JNVlBVTSIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb21haW5MaW5rYWdlQ3JlZGVudGlhbCJdfX0.aUFNReA4R5rcX_oYm3sPXqWtso_gjPHnWZsB6pWcGv6m3K8-4JIAvFov3ZTM8HxPOrOL17Qf4vBFdY9oK0HeCQ'
    const JSON_LD_DOMAIN_LINKAGE_CREDENTIAL = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://identity.foundation/.well-known/did-configuration/v1'],
      issuer: DID,
      issuanceDate: '2020-12-04T14:08:28-06:00',
      expirationDate: '2025-12-04T14:08:28-06:00',
      type: ['VerifiableCredential', 'DomainLinkageCredential'],
      credentialSubject: {
        id: DID,
        origin: ORIGIN,
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: '2020-12-04T20:08:28.540Z',
        jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..D0eDhglCMEjxDV9f_SNxsuU-r3ZB9GR4vaM9TYbyV7yzs1WfdUyYO8rFZdedHbwQafYy8YOpJ1iJlkSmB4JaDQ',
        proofPurpose: 'assertionMethod',
        verificationMethod: `${DID}#z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM`,
      },
    }

    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(testContext.tearDown)

    it('should issue DID configuration resource with JWT VC and callback name', async () => {
      const result = await agent.issueDidConfigurationResource({
        issuances: [
          {
            did: DID,
            origin: ORIGIN,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date().toISOString(),
            options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          },
        ],
        credentialIssuance: 'issueJwt',
      })

      expect(result).not.toBeNull()
      expect(result.linked_dids).not.toBeNull()
      expect(result.linked_dids.length).toEqual(1)
    })

    it('should issue DID configuration resource with JSONLD VC and callback name', async () => {
      const result = await agent.issueDidConfigurationResource({
        issuances: [
          {
            did: DID,
            origin: ORIGIN,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date().toISOString(),
            options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
          },
        ],
        credentialIssuance: 'issueJsonld',
      })

      expect(result).not.toBeNull()
      expect(result.linked_dids).not.toBeNull()
      expect(result.linked_dids.length).toEqual(1)
    })

    it('should save and retrieve DID configuration resource from DB', async () => {
      await agent.issueDidConfigurationResource({
        issuances: [
          {
            did: DID,
            origin: ORIGIN,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date().toISOString(),
            options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          },
        ],
        credentialIssuance: 'issueJwt',
        save: true,
      })

      const result = await agent.getDidConfigurationResource({ origin: ORIGIN })

      expect(result).not.toBeNull()
      expect(result.linked_dids).not.toBeNull()
      expect(result.linked_dids.length).toEqual(1)
      expect(result.linked_dids[0]).toEqual(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL)
    })

    it('should throw error when DID configuration resource cannot be found', async () => {
      const ORIGIN = 'https://unknown.com'

      await expect(agent.getDidConfigurationResource({ origin: ORIGIN })).rejects.toThrow(`No DID configuration resource found for origin: ${ORIGIN}`)
    })

    it('should issue DID configuration resource with JWT and JSONLD VCs', async () => {
      const result = await agent.issueDidConfigurationResource({
        issuances: [
          {
            did: DID,
            origin: ORIGIN,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date().toISOString(),
            options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
            credentialIssuance: 'issueJsonld',
          },
          {
            did: DID,
            origin: ORIGIN,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date().toISOString(),
            options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
            credentialIssuance: 'issueJwt',
          },
        ],
      })

      expect(result).not.toBeNull()
      expect(result.linked_dids).not.toBeNull()
      expect(result.linked_dids.length).toEqual(2)
    })

    it('should throw error when not all issuances have the same origin', async () => {
      await expect(
        agent.issueDidConfigurationResource({
          issuances: [
            {
              did: DID,
              origin: ORIGIN,
              issuanceDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
              credentialIssuance: 'issueJsonld',
            },
            {
              did: DID,
              origin: 'https://other.com',
              issuanceDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
              credentialIssuance: 'issueJwt',
            },
          ],
        }),
      ).rejects.toThrow('All verifiableCredentials should be issued for the same origin')
    })

    it('should throw error if credential issuance callbackName is not found when issueing DID configuration resource', async () => {
      const CALLBACK_NAME = 'unknown'
      await expect(
        agent.issueDidConfigurationResource({
          issuances: [
            {
              did: DID,
              origin: ORIGIN,
              issuanceDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
              credentialIssuance: CALLBACK_NAME,
            },
          ],
        }),
      ).rejects.toThrow(`Credential issuance not found for callbackName: ${CALLBACK_NAME}`)
    })

    it('should issue domain linkage JWT VC with callback name', async () => {
      const result = await agent.issueDomainLinkageCredential({
        did: DID,
        origin: ORIGIN,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
        credentialIssuance: 'issueJwt',
      })

      expect(result).not.toBeNull()
    })

    it('should save domain linkage JWT VC to DB', async () => {
      const result = await agent.issueDomainLinkageCredential({
        did: DID,
        origin: ORIGIN,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
        credentialIssuance: 'issueJwt',
        save: true,
      })

      expect(result).not.toBeNull()
    })

    it('should save domain linkage JSONLD VC to DB', async () => {
      const result = await agent.issueDomainLinkageCredential({
        did: DID,
        origin: ORIGIN,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
        credentialIssuance: 'issueJsonld',
        save: true,
      })

      expect(result).not.toBeNull()
    })

    it('should issue domain linkage JSONLD VC with callback name', async () => {
      const result = await agent.issueDomainLinkageCredential({
        did: DID,
        origin: ORIGIN,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date().toISOString(),
        options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
        credentialIssuance: 'issueJsonld',
      })

      expect(result).not.toBeNull()
      expect(result.proof).not.toBeNull()
    })

    it('should throw error if credential issuance callbackName is not found when issueing domain linkage credential', async () => {
      const CALLBACK_NAME = 'unknown'
      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: CALLBACK_NAME,
        }),
      ).rejects.toThrow(`Credential issuance not found for callbackName: ${CALLBACK_NAME}`)
    })

    it('should throw error when issueing domain linkage VC with invalid url origin', async () => {
      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: 'invalid_origin',
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: 'issueJwt',
        }),
      ).rejects.toThrow('Invalid URL')
    })

    it('should throw error when issueing domain linkage VC with invalid origin', async () => {
      const ORIGIN = 'https://example.com/other'

      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: 'issueJwt',
        }),
      ).rejects.toThrow(`Origin ${ORIGIN} is not valid`)
    })

    it('should throw error when issueing domain linkage VC with insecure origin', async () => {
      const ORIGIN = 'http://example.com'

      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: 'issueJwt',
        }),
      ).rejects.toThrow(`Origin ${ORIGIN} is not a https URL`)
    })

    it('should throw error when issueing domain linkage VC with invalid issuance date', async () => {
      const ISSUANCE_DATE = 'invalid_date'

      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: ISSUANCE_DATE,
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: 'issueJwt',
        }),
      ).rejects.toThrow(`IssuanceDate ${ISSUANCE_DATE} is not a valid date`)
    })

    it('should throw error when issueing domain linkage VC with invalid expiration date', async () => {
      const EXPIRATION_DATE = 'invalid_date'

      await expect(
        agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: EXPIRATION_DATE,
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: 'issueJwt',
        }),
      ).rejects.toThrow(`ExpirationDate ${EXPIRATION_DATE} is not a valid date`)
    })

    it('should throw error when adding service with invalid url origin', async () => {
      await expect(
        agent.addLinkedDomainsService({
          did: DID,
          origin: 'invalid_origin',
        }),
      ).rejects.toThrow('Invalid URL')
    })

    it('should throw error when adding service with invalid origin', async () => {
      const ORIGIN = 'http://example.com/other'

      await expect(
        agent.addLinkedDomainsService({
          did: DID,
          origin: ORIGIN,
        }),
      ).rejects.toThrow(`Origin ${ORIGIN} is not valid`)
    })

    it('should throw error when adding service with insecure origin', async () => {
      const ORIGIN = 'http://example.com'

      await expect(
        agent.addLinkedDomainsService({
          did: DID,
          origin: ORIGIN,
        }),
      ).rejects.toThrow(`Origin ${ORIGIN} is not a https URL`)
    })

    if (!testContext.isRestTest) {
      it('should remove credential issuance', async () => {
        const CALLBACK_NAME = 'remove'
        await agent.registerCredentialIssuance({
          callbackName: CALLBACK_NAME,
          credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
        })

        const result = await agent.removeCredentialIssuance({ callbackName: CALLBACK_NAME })

        expect(result).toEqual(true)
      })

      it('should register credential issuance', async () => {
        const CALLBACK_NAME = 'new'
        await agent.registerCredentialIssuance({
          callbackName: CALLBACK_NAME,
          credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
        })

        await expect(
          agent.registerCredentialIssuance({
            callbackName: CALLBACK_NAME,
            credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
          }),
        ).rejects.toThrow(`Credential issuance with callbackName: ${CALLBACK_NAME} already present`)
      })

      it('should issue DID configuration resource with JWT VC and callback', async () => {
        const result = await agent.issueDidConfigurationResource({
          issuances: [
            {
              did: DID,
              origin: ORIGIN,
              issuanceDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
            },
          ],
          credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
        })

        expect(result).not.toBeNull()
        expect(result.linked_dids).not.toBeNull()
        expect(result.linked_dids.length).toEqual(1)
      })

      it('should issue DID configuration resource with JSONLD VC and callback', async () => {
        const result = await agent.issueDidConfigurationResource({
          issuances: [
            {
              did: DID,
              origin: ORIGIN,
              issuanceDate: new Date().toISOString(),
              expirationDate: new Date().toISOString(),
              options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
            },
          ],
          credentialIssuance: () => Promise.resolve(JSON_LD_DOMAIN_LINKAGE_CREDENTIAL),
        })

        expect(result).not.toBeNull()
        expect(result.linked_dids).not.toBeNull()
        expect(result.linked_dids.length).toEqual(1)
      })

      it('should issue domain linkage JWT VC with callback', async () => {
        const result = await agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
          credentialIssuance: () => Promise.resolve(COMPACT_JWT_DOMAIN_LINKAGE_CREDENTIAL),
        })

        expect(result).not.toBeNull()
      })

      it('should issue domain linkage JSONLD VC with callback', async () => {
        const result = await agent.issueDomainLinkageCredential({
          did: DID,
          origin: ORIGIN,
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
          credentialIssuance: () => Promise.resolve(JSON_LD_DOMAIN_LINKAGE_CREDENTIAL),
        })

        expect(result).not.toBeNull()
        expect(result.proof).not.toBeNull()
      })
    }
  })
}
