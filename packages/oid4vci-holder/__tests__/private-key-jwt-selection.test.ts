import { describe, expect, it } from 'vitest'
import { shouldUsePrivateKeyJwt } from '../src/services/OID4VCIHolderService'

describe('shouldUsePrivateKeyJwt', () => {
  it('returns false when the AS does not list private_key_jwt', () => {
    expect(
      shouldUsePrivateKeyJwt({
        authMethodsSupported: ['client_secret_basic', 'client_secret_post', 'none'],
        signingAlgValuesSupported: ['RS256'],
        assertionAlg: 'ES256',
      }),
    ).toBe(false)
  })

  it('returns true when private_key_jwt is listed and no signing-alg restriction is advertised', () => {
    expect(
      shouldUsePrivateKeyJwt({
        authMethodsSupported: ['private_key_jwt'],
        assertionAlg: 'ES256',
      }),
    ).toBe(true)
  })

  it('returns true when private_key_jwt is listed and our signing alg is in the supported alg list', () => {
    expect(
      shouldUsePrivateKeyJwt({
        authMethodsSupported: ['client_secret_basic', 'private_key_jwt'],
        signingAlgValuesSupported: ['RS256', 'ES256'],
        assertionAlg: 'ES256',
      }),
    ).toBe(true)
  })

  // The edubadges case: AS lists private_key_jwt, but only accepts RS256/HS256 assertion signatures while the
  // wallet signs ES256. The AS cannot verify our assertion, so we must NOT send it (it would be rejected as a
  // conflicting client authentication method alongside the wallet's Basic auth).
  it('returns false when the AS restricts assertion algs and our signing alg is not supported (edubadges)', () => {
    expect(
      shouldUsePrivateKeyJwt({
        authMethodsSupported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'client_secret_jwt', 'none'],
        signingAlgValuesSupported: ['RS256', 'HS256'],
        assertionAlg: 'ES256',
      }),
    ).toBe(false)
  })

  it('returns false when the AS restricts assertion algs but our signing alg is unknown', () => {
    expect(
      shouldUsePrivateKeyJwt({
        authMethodsSupported: ['private_key_jwt'],
        signingAlgValuesSupported: ['RS256', 'HS256'],
        assertionAlg: undefined,
      }),
    ).toBe(false)
  })

  it('returns false when no auth methods are advertised at all', () => {
    expect(shouldUsePrivateKeyJwt({ assertionAlg: 'ES256' })).toBe(false)
  })
})
