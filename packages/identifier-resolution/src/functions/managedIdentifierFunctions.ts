import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, coseKeyToJwk, globalCrypto, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { pemOrDerToX509Certificate } from '@sphereon/ssi-sdk-ext.x509-utils'
import { contextHasDidManager, contextHasKeyManager } from '@sphereon/ssi-sdk.agent-config'
import type { ICoseKeyJson, JWK } from '@sphereon/ssi-types'
import type { IAgentContext, IIdentifier, IKey, IKeyManager } from '@veramo/core'
import { CryptoEngine, setEngine } from 'pkijs'
import { webcrypto } from 'node:crypto'
import type {
  IIdentifierResolution,
  ManagedIdentifierCoseKeyOpts,
  ManagedIdentifierCoseKeyResult,
  ManagedIdentifierDidOpts,
  ManagedIdentifierDidResult,
  ManagedIdentifierOID4VCIssuerOpts,
  ManagedIdentifierOID4VCIssuerResult,
  ManagedIdentifierJwkOpts,
  ManagedIdentifierJwkResult,
  ManagedIdentifierKeyOpts,
  ManagedIdentifierKeyResult,
  ManagedIdentifierKidOpts,
  ManagedIdentifierKidResult,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierResult,
  ManagedIdentifierX5cOpts,
  ManagedIdentifierX5cResult,
} from '../types'

import {
  isManagedIdentifierCoseKeyOpts,
  isManagedIdentifierDidOpts,
  isManagedIdentifierDidResult,
  isManagedIdentifierOID4VCIssuerOpts,
  isManagedIdentifierJwkOpts,
  isManagedIdentifierJwkResult,
  isManagedIdentifierKeyOpts,
  isManagedIdentifierKeyResult,
  isManagedIdentifierKidOpts,
  isManagedIdentifierX5cOpts,
} from '../types'

export async function getManagedKidIdentifier(
  opts: ManagedIdentifierKidOpts,
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierKidResult> {
  const method = 'kid'
  let key: IKey | undefined = undefined
  let issuer: string | undefined = undefined
  let kid: string | undefined = undefined
  if (!contextHasKeyManager(context)) {
    return Promise.reject(Error(`Cannot get Key/JWK identifier if KeyManager plugin is not enabled!`))
  } else if (opts.identifier.startsWith('did:')) {
    const did = opts.identifier.split('#')[0]
    const didIdentifier = await getManagedDidIdentifier({ ...opts, method: 'did', identifier: did }, context)
    key = didIdentifier.key
    issuer = didIdentifier.issuer
    kid = opts?.kid ?? (key.meta?.verificationMethod?.id as string) ?? didIdentifier.kid
  }
  if (!key) {
    key = await context.agent.keyManagerGet({ kid: opts.kmsKeyRef ?? opts.identifier })
  }
  const jwk = toJwk(key.publicKeyHex, key.type, { key })
  const jwkThumbprint = (key.meta?.jwkThumbprint as string) ?? calculateJwkThumbprint({ jwk })
  if (!kid) {
    kid = opts.kid ?? (key.meta?.verificationMethod?.id as string) ?? key.kid ?? jwkThumbprint
  }
  if (!issuer) {
    issuer = opts.issuer ?? kid // The different identifiers should set the value. Defaults to the kid
  }
  return {
    method,
    key,
    identifier: opts.identifier,
    jwk,
    jwkThumbprint,
    kid,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    issuer,
    kmsKeyRef: key.kid,
    opts,
  } satisfies ManagedIdentifierKidResult
}

export function isManagedIdentifierResult(
  identifier: ManagedIdentifierOptsOrResult & {
    crypto?: webcrypto.Crypto
  }
): identifier is ManagedIdentifierResult {
  return 'key' in identifier && 'kmsKeyRef' in identifier && 'method' in identifier && 'opts' in identifier && 'jwkThumbprint' in identifier
}

/**
 * Allows to get a managed identifier result in case identifier options are passed in, but returns the identifier directly in case results are passed in. This means resolution can have happened before, or happens in this method
 * @param identifier
 * @param context
 */
export async function ensureManagedIdentifierResult(
  identifier: ManagedIdentifierOptsOrResult & {
    crypto?: webcrypto.Crypto
  },
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierResult> {
  const { lazyDisabled = false } = identifier
  return !lazyDisabled && isManagedIdentifierResult(identifier) ? identifier : await getManagedIdentifier(identifier, context)
}

/**
 * This function is just a convenience function to get a common result. The user already apparently had a key, so could have called the kid version as well
 * @param opts
 * @param _context
 */
export async function getManagedKeyIdentifier(opts: ManagedIdentifierKeyOpts, _context?: IAgentContext<any>): Promise<ManagedIdentifierKeyResult> {
  const method = 'key'
  const key: IKey = opts.identifier
  if (opts.kmsKeyRef && opts.kmsKeyRef !== key.kid) {
    return Promise.reject(Error(`Cannot get a managed key object by providing a key and a kmsKeyRef that are different.}`))
  }
  const jwk = toJwk(key.publicKeyHex, key.type, { key })
  const jwkThumbprint = (key.meta?.jwkThumbprint as string) ?? calculateJwkThumbprint({ jwk })
  const kid = opts.kid ?? (key.meta?.verificationMethod?.id as string) ?? jwkThumbprint
  const issuer = opts.issuer ?? kid // The different identifiers should set the value. Defaults to the kid
  return {
    method,
    key,
    identifier: key,
    jwk,
    jwkThumbprint,
    kid,
    issuer,
    kmsKeyRef: key.kid,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  } satisfies ManagedIdentifierKeyResult
}

/**
 * This function is just a convenience function to get a common result. The user already apparently had a key, so could have called the kid version as well
 * @param opts
 * @param context
 */
export async function getManagedCoseKeyIdentifier(
  opts: ManagedIdentifierCoseKeyOpts,
  context: IAgentContext<any>
): Promise<ManagedIdentifierCoseKeyResult> {
  const method = 'cose_key'
  const coseKey: ICoseKeyJson = opts.identifier
  if (!contextHasKeyManager(context)) {
    return Promise.reject(Error(`Cannot get Cose Key identifier if KeyManager plugin is not enabled!`))
  }
  const jwk = coseKeyToJwk(coseKey)
  const jwkThumbprint = calculateJwkThumbprint({ jwk })
  const key = await context.agent.keyManagerGet({ kid: opts.kmsKeyRef ?? jwkThumbprint })
  const kid = opts.kid ?? coseKey.kid ?? jwkThumbprint
  const issuer = opts.issuer
  return {
    method,
    key,
    identifier: opts.identifier,
    jwk,
    jwkThumbprint,
    kid,
    issuer,
    kmsKeyRef: key.kid,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  } satisfies ManagedIdentifierCoseKeyResult
}

export async function getManagedDidIdentifier(opts: ManagedIdentifierDidOpts, context: IAgentContext<any>): Promise<ManagedIdentifierDidResult> {
  const method = 'did'
  if (!contextHasDidManager(context)) {
    return Promise.reject(Error(`Cannot get DID identifier if DID Manager plugin is not enabled!`))
  }

  let identifier: IIdentifier
  if (typeof opts.identifier === 'string') {
    identifier = await context.agent.didManagerGet({ did: opts.identifier.split('#')[0] })
  } else {
    identifier = opts.identifier
  }

  const did = identifier.did
  const keys = identifier?.keys // fixme: We really want to return the vmRelationship keys here actually
  const extendedKey = await getFirstKeyWithRelation(
    {
      ...opts,
      // Make sure we use offline mode if no pref was supplied. We are looking for managed DIDs after all. Could be it is not published yet
      offlineWhenNoDIDRegistered: opts.offlineWhenNoDIDRegistered ?? true,
      identifier,
      vmRelationship: opts.vmRelationship ?? 'verificationMethod',
    },
    context
  )
  const key = extendedKey
  const controllerKeyId = identifier.controllerKeyId
  const jwk = toJwk(key.publicKeyHex, key.type, { key })
  const jwkThumbprint = key.meta?.jwkThumbprint ?? calculateJwkThumbprint({ jwk })
  let kid = opts.kid ?? extendedKey.meta?.verificationMethod?.id
  if (!kid.startsWith(did)) {
    // Make sure we create a fully qualified kid
    const hash = kid.startsWith('#') ? '' : '#'
    kid = `${did}${hash}${kid}`
  }
  const issuer = opts.issuer ?? did
  return {
    method,
    key,
    did,
    kmsKeyRef: key.kid,
    jwk,
    jwkThumbprint,
    controllerKeyId,
    kid,
    keys,
    issuer,
    identifier,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  }
}

export async function getManagedJwkIdentifier(
  opts: ManagedIdentifierJwkOpts,
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierJwkResult> {
  const method = 'jwk'
  const { kid, issuer } = opts
  if (!contextHasKeyManager(context)) {
    return Promise.reject(Error(`Cannot get Key/JWK identifier if KeyManager plugin is not enabled!`))
  }
  const key = await context.agent.keyManagerGet({ kid: opts.kmsKeyRef ?? calculateJwkThumbprint({ jwk: opts.identifier }) })
  const jwk = opts.identifier ?? toJwk(key.publicKeyHex, key.type, { key })
  const jwkThumbprint = (key.meta?.jwkThumbprint as string) ?? calculateJwkThumbprint({ jwk })
  // we explicitly do not set the kid and issuer, meaning it can remain null. Normally you do not provide a kid and issuer with Jwks.
  return {
    method,
    key,
    kmsKeyRef: key.kid,
    identifier: jwk,
    jwk,
    jwkThumbprint,
    kid,
    issuer,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  } satisfies ManagedIdentifierJwkResult
}

export async function getManagedX5cIdentifier(
  opts: ManagedIdentifierX5cOpts & {
    crypto?: webcrypto.Crypto
  },
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierX5cResult> {
  const { kid, issuer } = opts
  const method = 'x5c'
  const x5c = opts.identifier
  if (x5c.length === 0) {
    return Promise.reject(`Cannot resolve x5c when an empty x5c is passed in`)
  } else if (!contextHasKeyManager(context)) {
    return Promise.reject(Error(`Cannot get X5c identifier if KeyManager plugin is not enabled!`))
  }
  const cryptoImpl = globalCrypto(false, opts.crypto)
  const certificate = pemOrDerToX509Certificate(x5c[0])
  const cryptoEngine = new CryptoEngine({ name: 'identifier_resolver_managed', crypto: cryptoImpl })
  setEngine(cryptoEngine.name, cryptoEngine)
  const pk = await certificate.getPublicKey(undefined, cryptoEngine)
  const jwk = (await cryptoEngine.subtle.exportKey('jwk', pk)) as JWK
  const jwkThumbprint = calculateJwkThumbprint({ jwk })
  const key = await context.agent.keyManagerGet({ kid: opts.kmsKeyRef ?? jwkThumbprint })
  // we explicitly do not set the kid and issuer, meaning it can remain null. Normally you do not provide a kid and issuer with x5c.

  return {
    method,
    x5c,
    identifier: x5c,
    certificate,
    jwk,
    jwkThumbprint,
    key,
    kmsKeyRef: key.kid,
    kid,
    issuer,
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  } satisfies ManagedIdentifierX5cResult
}

export async function getManagedOID4VCIssuerIdentifier(
  opts: ManagedIdentifierOID4VCIssuerOpts,
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierOID4VCIssuerResult> {
  const { identifier } = opts
  const method = 'oid4vci-issuer'
  // FIXME: We need to eventually determine the JWK based on the issuer. Using a dummy JWK for now
  const jwk = {
    kty: 'RSA',
    kid: 'dummy-jwk-for-vci-issuer-signing',
    use: 'sig',
    n: 'pjdss8ZaDfEH6K6U7GeW2nxDqR4IP049fk1fK0lndimbMMVBdPv_hSpm8T8EtBDxrUdi1OHZfMhUixGaut-3nQ4GG9nM249oxhCtxqqNvEXrmQRGqczyLxuh-fKn9Fg--hS9UpazHpfVAFnB5aCfXoNhPuI8oByyFKMKaOVgHNqP5NBEqabiLftZD3W_lsFCPGuzr4Vp0YS7zS2hDYScC2oOMu4rGU1LcMZf39p3153Cq7bS2Xh6Y-vw5pwzFYZdjQxDn8x8BG3fJ6j8TGLXQsbKH1218_HcUJRvMwdpbUQG5nvA2GXVqLqdwp054Lzk9_B_f1lVrmOKuHjTNHq48w',
    e: 'AQAB',
    d: 'ksDmucdMJXkFGZxiomNHnroOZxe8AmDLDGO1vhs-POa5PZM7mtUPonxwjVmthmpbZzla-kg55OFfO7YcXhg-Hm2OWTKwm73_rLh3JavaHjvBqsVKuorX3V3RYkSro6HyYIzFJ1Ek7sLxbjDRcDOj4ievSX0oN9l-JZhaDYlPlci5uJsoqro_YrE0PRRWVhtGynd-_aWgQv1YzkfZuMD-hJtDi1Im2humOWxA4eZrFs9eG-whXcOvaSwO4sSGbS99ecQZHM2TcdXeAs1PvjVgQ_dKnZlGN3lTWoWfQP55Z7Tgt8Nf1q4ZAKd-NlMe-7iqCFfsnFwXjSiaOa2CRGZn-Q',
    p: '4A5nU4ahEww7B65yuzmGeCUUi8ikWzv1C81pSyUKvKzu8CX41hp9J6oRaLGesKImYiuVQK47FhZ--wwfpRwHvSxtNU9qXb8ewo-BvadyO1eVrIk4tNV543QlSe7pQAoJGkxCia5rfznAE3InKF4JvIlchyqs0RQ8wx7lULqwnn0',
    q: 'ven83GM6SfrmO-TBHbjTk6JhP_3CMsIvmSdo4KrbQNvp4vHO3w1_0zJ3URkmkYGhz2tgPlfd7v1l2I6QkIh4Bumdj6FyFZEBpxjE4MpfdNVcNINvVj87cLyTRmIcaGxmfylY7QErP8GFA-k4UoH_eQmGKGK44TRzYj5hZYGWIC8',
    dp: 'lmmU_AG5SGxBhJqb8wxfNXDPJjf__i92BgJT2Vp4pskBbr5PGoyV0HbfUQVMnw977RONEurkR6O6gxZUeCclGt4kQlGZ-m0_XSWx13v9t9DIbheAtgVJ2mQyVDvK4m7aRYlEceFh0PsX8vYDS5o1txgPwb3oXkPTtrmbAGMUBpE',
    dq: 'mxRTU3QDyR2EnCv0Nl0TCF90oliJGAHR9HJmBe__EjuCBbwHfcT8OG3hWOv8vpzokQPRl5cQt3NckzX3fs6xlJN4Ai2Hh2zduKFVQ2p-AF2p6Yfahscjtq-GY9cB85NxLy2IXCC0PF--Sq9LOrTE9QV988SJy_yUrAjcZ5MmECk',
    qi: 'ldHXIrEmMZVaNwGzDF9WG8sHj2mOZmQpw9yrjLK9hAsmsNr5LTyqWAqJIYZSwPTYWhY4nu2O0EY9G9uYiqewXfCKw_UngrJt8Xwfq1Zruz0YY869zPN4GiE9-9rzdZB33RBw8kIOquY3MK74FMwCihYx_LiU2YTHkaoJ3ncvtvg',
  } as JWK
  const jwkThumbprint = calculateJwkThumbprint({ jwk })

  const key = {
    kid: 'dummy-key-for-vci-issuer-signing',
    kms: 'local',
    type: 'RSA',
    publicKeyHex: '9a3f75b2e4d8b91128fc6e9a8f6782e5a4f1cba3718e58b5d0a789d6e5f52b3a',
  } as IKey

  return {
    method,
    identifier,
    jwk,
    jwkThumbprint,
    key, // FIXME: We need construct a key as soon as we have the external VCI Issuer resolution
    kmsKeyRef: identifier, // FIXME: We need use kmsKeyRef as soon as we have the external VCI Issuer resolution
    issuer: identifier.replace('/.well-known/openid-credential-issuer', ''),
    clientId: opts.clientId,
    clientIdScheme: opts.clientIdScheme,
    opts,
  } satisfies ManagedIdentifierOID4VCIssuerResult
}

export async function getManagedIdentifier(
  opts: ManagedIdentifierOptsOrResult & {
    crypto?: webcrypto.Crypto
  },
  context: IAgentContext<IKeyManager>
): Promise<ManagedIdentifierResult> {
  let resolutionResult: ManagedIdentifierResult
  if (isManagedIdentifierResult(opts)) {
    opts
  }
  if (isManagedIdentifierKidOpts(opts)) {
    resolutionResult = await getManagedKidIdentifier(opts, context)
  } else if (isManagedIdentifierDidOpts(opts)) {
    resolutionResult = await getManagedDidIdentifier(opts, context)
  } else if (isManagedIdentifierJwkOpts(opts)) {
    resolutionResult = await getManagedJwkIdentifier(opts, context)
  } else if (isManagedIdentifierX5cOpts(opts)) {
    resolutionResult = await getManagedX5cIdentifier(opts, context)
  } else if (isManagedIdentifierKeyOpts(opts)) {
    resolutionResult = await getManagedKeyIdentifier(opts, context)
  } else if (isManagedIdentifierCoseKeyOpts(opts)) {
    resolutionResult = await getManagedCoseKeyIdentifier(opts, context)
  } else if (isManagedIdentifierOID4VCIssuerOpts(opts)) {
    resolutionResult = await getManagedOID4VCIssuerIdentifier(opts, context)
  } else {
    return Promise.reject(Error(`Could not determine identifier method. Please provide explicitly`))
  }
  const { key } = resolutionResult
  if (
    (!key && !isManagedIdentifierOID4VCIssuerOpts(opts)) ||
    (isManagedIdentifierDidOpts(opts) && isManagedIdentifierDidResult(resolutionResult) && !resolutionResult.identifier)
  ) {
    console.log(`Cannot find identifier`, opts.identifier)
    return Promise.reject(`Cannot find identifier ${opts.identifier}`)
  }
  return resolutionResult
}

export async function managedIdentifierToKeyResult(
  identifier: ManagedIdentifierOptsOrResult,
  context: IAgentContext<IIdentifierResolution & IKeyManager>
): Promise<ManagedIdentifierKeyResult> {
  const resolved = await ensureManagedIdentifierResult(identifier, context)
  if (isManagedIdentifierKeyResult(resolved)) {
    return resolved
  }

  return {
    ...resolved,
    method: 'key',
    identifier: resolved.key,
  } satisfies ManagedIdentifierKeyResult
}

export async function managedIdentifierToJwk(
  identifier: ManagedIdentifierOptsOrResult,
  context: IAgentContext<IIdentifierResolution & IKeyManager>
): Promise<ManagedIdentifierJwkResult> {
  const resolved = await ensureManagedIdentifierResult(identifier, context)
  if (isManagedIdentifierJwkResult(resolved)) {
    return resolved
  }
  return {
    ...resolved,
    method: 'jwk',
    identifier: resolved.jwk,
  } satisfies ManagedIdentifierJwkResult
}
