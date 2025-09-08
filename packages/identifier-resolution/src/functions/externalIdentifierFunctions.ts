import { didDocumentToJwks, getAgentResolver, jwkTtoPublicKeyHex } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, coseKeyToJwk, globalCrypto } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  getSubjectDN,
  pemOrDerToX509Certificate,
  PEMToDer,
  validateX509CertificateChain,
  type X509ValidationResult,
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { type IParsedDID, type JWK, parseDid } from '@sphereon/ssi-types'
import type { IAgentContext, IDIDManager, IResolver } from '@veramo/core'
import { isDefined } from '@veramo/utils'
import { CryptoEngine, setEngine } from 'pkijs'
import type {
  ExternalIdentifierCoseKeyOpts,
  ExternalIdentifierCoseKeyResult,
  ExternalIdentifierDidOpts,
  ExternalIdentifierDidResult,
  ExternalIdentifierJwkOpts,
  ExternalIdentifierJwkResult,
  ExternalIdentifierMethod,
  ExternalIdentifierOpts,
  ExternalIdentifierResult,
  ExternalIdentifierX5cOpts,
  ExternalIdentifierX5cResult,
  ExternalJwkInfo,
} from '../types'
import {
  isExternalIdentifierCoseKeyOpts,
  isExternalIdentifierDidOpts,
  isExternalIdentifierJwkOpts,
  isExternalIdentifierJwksUrlOpts,
  isExternalIdentifierKidOpts,
  isExternalIdentifierOidcDiscoveryOpts,
  isExternalIdentifierOIDFEntityIdOpts,
  isExternalIdentifierX5cOpts,
} from '../types'
import { resolveExternalOIDFEntityIdIdentifier } from '.'

import { webcrypto } from 'node:crypto'
export async function resolveExternalIdentifier(
  opts: ExternalIdentifierOpts & {
    crypto?: webcrypto.Crypto
  },
  context: IAgentContext<any>
): Promise<ExternalIdentifierResult> {
  let method: ExternalIdentifierMethod | undefined
  if (isExternalIdentifierDidOpts(opts)) {
    return resolveExternalDidIdentifier(opts, context)
  } else if (isExternalIdentifierX5cOpts(opts)) {
    return resolveExternalX5cIdentifier(opts, context)
  } else if (isExternalIdentifierJwkOpts(opts)) {
    return resolveExternalJwkIdentifier(opts, context)
  } else if (isExternalIdentifierCoseKeyOpts(opts)) {
    return resolveExternalCoseKeyIdentifier(opts, context)
  } else if (isExternalIdentifierOIDFEntityIdOpts(opts)) {
    return resolveExternalOIDFEntityIdIdentifier(opts, context)
  } else if (isExternalIdentifierKidOpts(opts)) {
    method = 'kid'
  } else if (isExternalIdentifierJwksUrlOpts(opts)) {
    method = 'jwks-url'
  } else if (isExternalIdentifierOidcDiscoveryOpts(opts)) {
    method = 'oidc-discovery'
  }
  throw Error(`External resolution method ${method} is not yet implemented`)
}

export async function resolveExternalX5cIdentifier(
  opts: ExternalIdentifierX5cOpts & {
    crypto?: webcrypto.Crypto
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<ExternalIdentifierX5cResult> {
  if (!isExternalIdentifierX5cOpts(opts)) {
    return Promise.reject('External x5c Identifier args need to be provided')
  }
  const verify = opts.verify ?? true
  const x5c = opts.identifier.map((derOrPem) => (derOrPem.includes('CERTIFICATE') ? PEMToDer(derOrPem) : derOrPem))
  if (x5c.length === 0) {
    return Promise.reject('Empty certification chain is not allowed')
  }
  const certificates = x5c.map(pemOrDerToX509Certificate)

  let verificationResult: X509ValidationResult | undefined
  let issuerJWK: JWK | undefined
  let jwks: ExternalJwkInfo[] = []

  if (verify) {
    // We use the agent plugin if it is available as that is more powerful, but revert to the function otherwise
    if (contextHasPlugin(context, 'verifyCertificateChain')) {
      verificationResult = (await context.agent.verifyCertificateChain({
        chain: opts.identifier,
        trustAnchors: opts.trustAnchors ?? [],
        verificationTime: opts.verificationTime,
      })) as X509ValidationResult // We need to cast, as we know this is the value and we do not want to rely on the x509 plugin perse
    } else {
      verificationResult = await validateX509CertificateChain({
        chain: opts.identifier,
        trustAnchors: opts.trustAnchors ?? [],
        verificationTime: opts.verificationTime,
        opts,
      })
    }
    if (verificationResult.certificateChain) {
      jwks = verificationResult.certificateChain.map((cert) => {
        return {
          jwk: cert.publicKeyJWK,
          kid: cert.subject.dn.DN,
          jwkThumbprint: calculateJwkThumbprint({ jwk: cert.publicKeyJWK }),
          publicKeyHex: jwkTtoPublicKeyHex(cert.publicKeyJWK),
        } satisfies ExternalJwkInfo
      })
    }
  }
  if (!jwks || jwks.length === 0) {
    const cryptoEngine = new CryptoEngine({
      name: 'identifier_resolver_external',
      crypto: globalCrypto(false, opts.crypto),
    })
    setEngine(cryptoEngine.name, cryptoEngine)
    jwks = await Promise.all(
      certificates.map(async (cert) => {
        const pk = await cert.getPublicKey(undefined, cryptoEngine)
        const jwk = (await cryptoEngine.exportKey('jwk', pk)) as JWK
        return {
          jwk,
          kid: getSubjectDN(cert).DN,
          jwkThumbprint: calculateJwkThumbprint({ jwk }),
          publicKeyHex: jwkTtoPublicKeyHex(jwk),
        } satisfies ExternalJwkInfo
      })
    )
  }
  if (jwks.length === 0) {
    return Promise.reject('Empty certification chain is now allowed')
  }
  if (!issuerJWK) {
    issuerJWK = jwks[0].jwk
  }

  return {
    method: 'x5c',
    verificationResult,
    issuerJWK,
    jwks,
    certificates,
    x5c,
  }
}

/**
 * Resolves a JWK. Normally this is just returning the JWK, but in case the JWK contains a x5c the chain is validated
 * @param opts
 * @param context
 */
export async function resolveExternalJwkIdentifier(
  opts: ExternalIdentifierJwkOpts & {
    x5c?: ExternalIdentifierX5cOpts
  },
  context: IAgentContext<any>
): Promise<ExternalIdentifierJwkResult> {
  if (!isExternalIdentifierJwkOpts(opts)) {
    return Promise.reject('External JWK Identifier args need to be provided')
  }
  const jwk = opts.identifier
  let x5c: ExternalIdentifierX5cResult | undefined = undefined
  if (jwk.x5c) {
    x5c = await resolveExternalX5cIdentifier({ ...opts.x5c, identifier: jwk.x5c }, context)
  }
  const jwkThumbprint = calculateJwkThumbprint({ jwk })
  return {
    method: 'jwk',
    jwk,
    jwks: [
      {
        jwk,
        jwkThumbprint,
        kid: jwk.kid,
        publicKeyHex: jwkTtoPublicKeyHex(jwk),
      },
    ],
    x5c,
  } satisfies ExternalIdentifierJwkResult
}

/**
 * Resolves a JWK. Normally this is just returning the JWK, but in case the JWK contains a x5c the chain is validated
 * @param opts
 * @param context
 */
export async function resolveExternalCoseKeyIdentifier(
  opts: ExternalIdentifierCoseKeyOpts & {
    x5c?: ExternalIdentifierX5cOpts
  },
  context: IAgentContext<any>
): Promise<ExternalIdentifierCoseKeyResult> {
  if (!isExternalIdentifierCoseKeyOpts(opts)) {
    return Promise.reject('External Cose Key args need to be provided')
  }
  // TODO: We need to do cbor conversion here as well.
  const coseKey = opts.identifier
  let x5c: ExternalIdentifierX5cResult | undefined = undefined
  if (coseKey.x5chain) {
    x5c = await resolveExternalX5cIdentifier({ ...opts.x5c, identifier: coseKey.x5chain }, context)
  }
  const jwk = coseKeyToJwk(coseKey)
  const jwkThumbprint = calculateJwkThumbprint({ jwk })
  return {
    method: 'cose_key',
    coseKey,
    jwks: [
      {
        jwk,
        jwkThumbprint,
        kid: coseKey.kid,
        publicKeyHex: jwkTtoPublicKeyHex(jwk),
      },
    ],
    x5c,
  } satisfies ExternalIdentifierCoseKeyResult
}

export async function resolveExternalDidIdentifier(
  opts: ExternalIdentifierDidOpts,
  context: IAgentContext<IResolver & IDIDManager>
): Promise<ExternalIdentifierDidResult> {
  if (!isExternalIdentifierDidOpts(opts)) {
    return Promise.reject('External DID Identifier args need to be provided')
  } else if (!contextHasPlugin<IResolver & IDIDManager>(context, 'resolveDid')) {
    return Promise.reject(Error(`Cannot get external DID identifier if DID resolver plugin is not enabled!`))
  }
  const { uniresolverResolution = false, localResolution = true, resolverResolution = true } = opts
  const did = opts.identifier
  let parsed: IParsedDID
  try {
    parsed = parseDid(did)
  } catch (error: unknown) {
    // Error from did resolution spec
    return Promise.reject(error)
  }
  const didParsed = parsed
  const didResolutionResult = await getAgentResolver(context, {
    uniresolverResolution,
    localResolution,
    resolverResolution,
  }).resolve(did)
  const didDocument = didResolutionResult.didDocument ?? undefined
  const didJwks = didDocument ? didDocumentToJwks(didDocument) : undefined
  const jwks = didJwks
    ? Array.from(
        new Set(
          Array.from(
            Object.values(didJwks)
              .filter((jwks) => isDefined(jwks) && jwks.length > 0)
              .flatMap((jwks) => jwks)
          )
            .flatMap((jwk) => {
              return {
                jwk,
                jwkThumbprint: calculateJwkThumbprint({ jwk }),
                kid: jwk.kid,
                publicKeyHex: jwkTtoPublicKeyHex(jwk),
              }
            })
            .map((jwk) => JSON.stringify(jwk))
        )
      ).map((jwks) => JSON.parse(jwks))
    : []

  if (didResolutionResult?.didDocument) {
    // @ts-ignore // Mandatory on the original object, but we already provide it directly
    delete didResolutionResult['didDocument']
  }
  return {
    method: 'did',
    did,
    jwks,
    didJwks,
    didDocument,
    didResolutionResult,
    didParsed,
  }
}
