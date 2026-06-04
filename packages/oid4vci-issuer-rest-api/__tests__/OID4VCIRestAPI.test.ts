import { CredentialCorrelationType } from '@sphereon/ssi-sdk.credential-store'
import { CredentialRole } from '@sphereon/ssi-types'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

const { oid4VciServerMock, getBasePathMock } = vitest.hoisted(() => ({
  oid4VciServerMock: vitest.fn(),
  getBasePathMock: vitest.fn().mockReturnValue('/'),
}))

vitest.mock('@sphereon/oid4vci-issuer-server', () => ({
  OID4VCIServer: oid4VciServerMock,
  getBasePath: getBasePathMock,
}))

import { OID4VCIRestAPI } from '../src'

describe('OID4VCIRestAPI', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
    getBasePathMock.mockReturnValue('/')
    oid4VciServerMock.mockImplementation(function (_expressSupport: unknown, opts: unknown) {
      return { opts }
    })
  })

  describe('buildPersistenceSignerWrapper', () => {
    it('persists an issued credential using the resolved issuer identifier', async () => {
      const signedCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        credentialSubject: {
          id: 'did:example:subject',
        },
      }
      const identifierManagedGet = vitest.fn().mockResolvedValue({
        issuer: 'did:example:issuer',
        identifier: 'did:example:issuer',
        kmsKeyRef: 'key-1',
        method: 'did',
      })
      const crsAddCredential = vitest.fn().mockResolvedValue({ id: 'dc-1' })
      const context = {
        agent: {
          identifierManagedGet,
          crsAddCredential,
        },
      }
      const instance = {
        issuerOptions: {
          idOpts: {
            identifier: 'did:example:issuer',
          },
        },
      }
      const originalSigner = vitest.fn().mockResolvedValue(signedCredential)

      const buildPersistenceSignerWrapper = (OID4VCIRestAPI as any).buildPersistenceSignerWrapper
      const wrapped = buildPersistenceSignerWrapper({ context, instance })(originalSigner)

      await expect(wrapped({ some: 'args' })).resolves.toEqual(signedCredential)

      expect(identifierManagedGet).toHaveBeenCalledWith({
        identifier: 'did:example:issuer',
        issuer: 'did:example:issuer',
        vmRelationship: 'assertionMethod',
      })
      expect(crsAddCredential).toHaveBeenCalledWith({
        credential: {
          credentialRole: CredentialRole.ISSUER,
          kmsKeyRef: 'key-1',
          identifierMethod: 'did',
          issuerCorrelationId: 'did:example:issuer',
          issuerCorrelationType: CredentialCorrelationType.DID,
          rawDocument: JSON.stringify(signedCredential),
        },
      })
    })

    it('persists URL issuers with URL correlation type', async () => {
      const signedCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'https://issuer.example.org',
        credentialSubject: {
          id: 'did:example:subject',
        },
      }
      const identifierManagedGet = vitest.fn().mockResolvedValue({
        issuer: 'https://issuer.example.org',
        identifier: 'https://issuer.example.org',
        kmsKeyRef: 'key-2',
        method: 'jwk',
      })
      const crsAddCredential = vitest.fn().mockResolvedValue({ id: 'dc-2' })
      const context = {
        agent: {
          identifierManagedGet,
          crsAddCredential,
        },
      }
      const instance = {
        issuerOptions: {
          idOpts: {
            identifier: 'https://issuer.example.org',
          },
        },
      }
      const originalSigner = vitest.fn().mockResolvedValue(signedCredential)

      const buildPersistenceSignerWrapper = (OID4VCIRestAPI as any).buildPersistenceSignerWrapper
      const wrapped = buildPersistenceSignerWrapper({ context, instance })(originalSigner)

      await wrapped({ some: 'args' })

      expect(identifierManagedGet).toHaveBeenCalledWith({
        identifier: 'https://issuer.example.org',
        issuer: 'https://issuer.example.org',
        vmRelationship: 'assertionMethod',
      })
      expect(crsAddCredential).toHaveBeenCalledWith({
        credential: {
          credentialRole: CredentialRole.ISSUER,
          kmsKeyRef: 'key-2',
          identifierMethod: 'jwk',
          issuerCorrelationId: 'https://issuer.example.org',
          issuerCorrelationType: CredentialCorrelationType.URL,
          rawDocument: JSON.stringify(signedCredential),
        },
      })
    })

    it('propagates credential store failures', async () => {
      const signedCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        credentialSubject: {
          id: 'did:example:subject',
        },
      }
      const context = {
        agent: {
          identifierManagedGet: vitest.fn().mockResolvedValue({
            issuer: 'did:example:issuer',
            identifier: 'did:example:issuer',
            kmsKeyRef: 'key-1',
            method: 'did',
          }),
          crsAddCredential: vitest.fn().mockRejectedValue(new Error('db down')),
        },
      }
      const instance = {
        issuerOptions: {
          idOpts: {
            identifier: 'did:example:issuer',
          },
        },
      }
      const originalSigner = vitest.fn().mockResolvedValue(signedCredential)

      const buildPersistenceSignerWrapper = (OID4VCIRestAPI as any).buildPersistenceSignerWrapper
      const wrapped = buildPersistenceSignerWrapper({ context, instance })(originalSigner)

      await expect(wrapped({ some: 'args' })).rejects.toThrow('db down')
    })
  })

  describe('init', () => {
    it('passes a signer wrapper to the issuer instance when persistence is enabled', async () => {
      const instance = {
        metadataOptions: {
          credentialIssuer: 'https://issuer.example.org',
        },
        issuerOptions: {
          idOpts: {
            identifier: 'did:example:issuer',
          },
        },
        get: vitest.fn().mockResolvedValue({
          issuerMetadata: {
            credential_issuer: 'https://issuer.example.org',
          },
        }),
      }
      const context = {
        agent: {
          oid4vciGetInstance: vitest.fn().mockResolvedValue(instance),
        },
      }
      const expressSupport = {
        express: {
          use: vitest.fn(),
          set: vitest.fn(),
        },
        stop: vitest.fn(),
      }

      await OID4VCIRestAPI.init({
        context: context as any,
        expressSupport: expressSupport as any,
        issuerInstanceArgs: {
          credentialIssuer: 'https://issuer.example.org',
        },
        opts: {
          baseUrl: 'https://issuer.example.org',
          persistIssuedCredentials: true,
          endpointOpts: {
            tokenEndpointOpts: {
              tokenEndpointDisabled: true,
            },
          },
        },
      })

      expect(instance.get).toHaveBeenCalledTimes(1)
      expect(instance.get.mock.calls[0][0]).toMatchObject({
        context,
        wrapCredentialSignerCallback: expect.any(Function),
      })
    })
  })
})
