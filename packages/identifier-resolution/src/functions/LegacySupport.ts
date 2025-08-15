import type { IIdentifier } from '@veramo/core'
import type { ManagedIdentifierDidOpts, ManagedIdentifierOptsOrResult } from '../types'

/**
 * Converts legacy id opts key refs to the new ManagedIdentifierOpts
 * @param opts
 */
export function legacyKeyRefsToIdentifierOpts(opts: {
  idOpts?: ManagedIdentifierOptsOrResult
  iss?: string
  keyRef?: string
  didOpts?: any
}): ManagedIdentifierOptsOrResult {
  if (!opts.idOpts) {
    console.warn(
      `Legacy idOpts being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`
    )
    // legacy way
    let kmsKeyRef =
      opts.keyRef ??
      opts.didOpts?.idOpts?.kmsKeyRef ??
      opts.didOpts?.kid ??
      opts.didOpts?.idOpts?.kid ??
      (typeof opts.didOpts?.idOpts?.identifier === 'object' ? (opts.didOpts.idOpts.identifier as IIdentifier).keys[0].kid : undefined)
    if (!kmsKeyRef) {
      throw Error('Key ref is needed for access token signer')
    }
    let identifier = (opts.didOpts?.identifier ?? opts.didOpts?.idOpts?.identifier) as IIdentifier | undefined

    return {
      kmsKeyRef: opts.keyRef ?? kmsKeyRef,
      identifier: identifier ?? kmsKeyRef,
      issuer: opts.iss,
    } satisfies ManagedIdentifierDidOpts
  } else {
    const idOpts = opts.idOpts
    if (opts.keyRef && !idOpts.kmsKeyRef) {
      // legacy way
      console.warn(
        `Legacy keyRef being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`
      )
      idOpts.kmsKeyRef = opts.keyRef
    }
    if (opts.iss && !idOpts.issuer) {
      // legacy way
      console.warn(
        `Legacy iss being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`
      )
      idOpts.issuer = opts.iss
    }

    return idOpts
  }
}
