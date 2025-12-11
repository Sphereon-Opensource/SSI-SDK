import { describe, expect, it, beforeEach } from 'vitest'
import { IssuerMetadata } from '@sphereon/oid4vci-common'
import { OID4VCIStore } from '../src/agent/OID4VCIStore'

describe('OID4VCIStore - Metadata Import and Merge', () => {
  let store: OID4VCIStore

  beforeEach(() => {
    store = new OID4VCIStore({
      defaultStore: '_default',
      defaultNamespace: 'oid4vci',
    })
  })

  describe('importMetadatas', () => {
    it('should import single metadata', async () => {
      const metadata: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata,
          correlationId: 'test-1',
        },
      ])

      const stored = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'test-1',
      })

      expect(stored?.credential_issuer).toBe('https://example.com')
      expect(stored?.credential_configurations_supported?.PID).toBeDefined()
    })

    it('should merge metadata configurations when importing sequentially', async () => {
      const meta1: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          Test15: {
            format: 'dc+sd-jwt',
            vct: 'Test15',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      const meta2: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
          VerifiedEmployee: {
            format: 'dc+sd-jwt',
            scope: 'verified_employee',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata: meta1,
          correlationId: 'test-2',
        },
        {
          metadataType: 'issuer',
          metadata: meta2,
          correlationId: 'test-2',
        },
      ])

      const stored = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'test-2',
      })

      expect(stored?.credential_configurations_supported?.Test15).toBeDefined()
      expect(stored?.credential_configurations_supported?.PID).toBeDefined()
      expect(stored?.credential_configurations_supported?.VerifiedEmployee).toBeDefined()
      expect(Object.keys(stored?.credential_configurations_supported || {})).toHaveLength(3)
    })

    it('should respect overwriteExisting=false flag', async () => {
      const meta1: IssuerMetadata = {
        credential_issuer: 'https://example.com/v1',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      const meta2: IssuerMetadata = {
        credential_issuer: 'https://example.com/v2',
        credential_configurations_supported: {
          VerifiedEmployee: {
            format: 'dc+sd-jwt',
            scope: 'verified_employee',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata: meta1,
          correlationId: 'test-3',
        },
        {
          metadataType: 'issuer',
          metadata: meta2,
          correlationId: 'test-3',
          overwriteExisting: false,
        },
      ])

      const stored = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'test-3',
      })

      expect(stored?.credential_issuer).toBe('https://example.com/v1')
      expect(stored?.credential_configurations_supported?.PID).toBeDefined()
      expect(stored?.credential_configurations_supported?.VerifiedEmployee).toBeUndefined()
    })

    it('should deep merge nested objects', async () => {
      const meta1: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      const meta2: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256', 'EdDSA'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata: meta1,
          correlationId: 'test-4',
        },
        {
          metadataType: 'issuer',
          metadata: meta2,
          correlationId: 'test-4',
        },
      ])

      const stored = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'test-4',
      })

      expect(stored?.credential_configurations_supported?.PID?.proof_types_supported?.jwt?.proof_signing_alg_values_supported).toEqual([
        'ES256',
        'EdDSA',
      ])
    })

    it('should replace arrays instead of merging', async () => {
      const meta1: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      const meta2: IssuerMetadata = {
        credential_issuer: 'https://example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web', 'did:jwk', 'did:key'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata: meta1,
          correlationId: 'test-5',
        },
        {
          metadataType: 'issuer',
          metadata: meta2,
          correlationId: 'test-5',
        },
      ])

      const stored = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'test-5',
      })

      expect(stored?.credential_configurations_supported?.PID?.cryptographic_binding_methods_supported).toEqual(['did:web', 'did:jwk', 'did:key'])
    })

    it('should handle multiple issuers independently', async () => {
      const meta1: IssuerMetadata = {
        credential_issuer: 'https://issuer1.example.com',
        credential_configurations_supported: {
          PID: {
            format: 'dc+sd-jwt',
            scope: 'pid',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      const meta2: IssuerMetadata = {
        credential_issuer: 'https://issuer2.example.com',
        credential_configurations_supported: {
          VerifiedEmployee: {
            format: 'dc+sd-jwt',
            scope: 'verified_employee',
            cryptographic_binding_methods_supported: ['did:web'],
            credential_signing_alg_values_supported: ['ES256'],
            proof_types_supported: {
              jwt: {
                proof_signing_alg_values_supported: ['ES256'],
              },
            },
          },
        },
      }

      await store.importMetadatas([
        {
          metadataType: 'issuer',
          metadata: meta1,
          correlationId: 'issuer-1',
        },
        {
          metadataType: 'issuer',
          metadata: meta2,
          correlationId: 'issuer-2',
        },
      ])

      const stored1 = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'issuer-1',
      })

      const stored2 = await store.oid4vciStoreGetMetadata({
        metadataType: 'issuer',
        correlationId: 'issuer-2',
      })

      expect(stored1?.credential_issuer).toBe('https://issuer1.example.com')
      expect(stored1?.credential_configurations_supported?.PID).toBeDefined()

      expect(stored2?.credential_issuer).toBe('https://issuer2.example.com')
      expect(stored2?.credential_configurations_supported?.VerifiedEmployee).toBeDefined()
    })
  })
})
