import { globalCrypto } from '@sphereon/ssi-sdk-ext.key-utils'
import type { IAgentContext, IAgentPlugin, IDIDManager, IKeyManager } from '@veramo/core'
import type { ExternalIdentifierOIDFEntityIdOpts, ExternalIdentifierOIDFEntityIdResult } from '../types'
import { schema } from '../index'
import { resolveExternalIdentifier, ensureManagedIdentifierResult } from '../functions'
import type {
  ExternalIdentifierDidOpts,
  ExternalIdentifierDidResult,
  ExternalIdentifierOpts,
  ExternalIdentifierResult,
  ExternalIdentifierX5cOpts,
  ExternalIdentifierX5cResult,
  ExternalIdentifierCoseKeyOpts,
  ExternalIdentifierCoseKeyResult,
  ExternalIdentifierJwkOpts,
  ExternalIdentifierJwkResult,
  IIdentifierResolution,
  ManagedIdentifierCoseKeyOpts,
  ManagedIdentifierCoseKeyResult,
  ManagedIdentifierDidOpts,
  ManagedIdentifierDidResult,
  ManagedIdentifierJwkOpts,
  ManagedIdentifierJwkResult,
  ManagedIdentifierKidOpts,
  ManagedIdentifierKidResult,
  ManagedIdentifierResult,
  ManagedIdentifierX5cOpts,
  ManagedIdentifierX5cResult,
  ManagedIdentifierOID4VCIssuerResult,
  ManagedIdentifierKeyOpts,
  ManagedIdentifierKeyResult,
  ManagedIdentifierOptsOrResult,
  ManagedIdentifierOID4VCIssuerOpts,
} from '../types'
import type { IOIDFClient } from '@sphereon/ssi-sdk.oidf-client'

import { webcrypto } from 'node:crypto'

/**
 * @public
 */
export class IdentifierResolution implements IAgentPlugin {
  readonly _crypto: webcrypto.Crypto

  readonly schema = schema.IMnemonicInfoGenerator
  readonly methods: IIdentifierResolution = {
    identifierManagedGet: this.identifierManagedGet.bind(this),
    identifierManagedGetByDid: this.identifierManagedGetByDid.bind(this),
    identifierManagedGetByKid: this.identifierManagedGetByKid.bind(this),
    identifierManagedGetByJwk: this.identifierManagedGetByJwk.bind(this),
    identifierManagedGetByX5c: this.identifierManagedGetByX5c.bind(this),
    identifierManagedGetByKey: this.identifierManagedGetByKey.bind(this),
    identifierManagedGetByCoseKey: this.identifierManagedGetByCoseKey.bind(this),
    identifierManagedGetByOID4VCIssuer: this.identifierManagedGetByOID4VCIssuer.bind(this),

    identifierExternalResolve: this.identifierExternalResolve.bind(this),
    identifierExternalResolveByDid: this.identifierExternalResolveByDid.bind(this),
    identifierExternalResolveByX5c: this.identifierExternalResolveByX5c.bind(this),
    identifierExternalResolveByJwk: this.identifierExternalResolveByJwk.bind(this),
    identifierExternalResolveByCoseKey: this.identifierExternalResolveByCoseKey.bind(this),
    identifierExternalResolveByOIDFEntityId: this.identifierExternalResolveByOIDFEntityId.bind(this),

    // todo: JWKSet, oidc-discovery, oid4vci-issuer etc. Anything we already can resolve and need keys of
  }

  /**
   * TODO: Add a cache, as we are retrieving the same keys/info quite often
   */
  constructor(opts?: { crypto?: webcrypto.Crypto }) {
    this._crypto = globalCrypto(false, opts?.crypto)
  }

  /**
   * Main method for managed identifiers. We always go through this method (also the other methods below) as we want to
   * integrate a plugin for anomaly detection. Having a single method helps
   * @param args
   * @param context
   */
  private async identifierManagedGet(
    args: ManagedIdentifierOptsOrResult,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierResult> {
    return await ensureManagedIdentifierResult({ ...args, crypto: this._crypto }, context)
  }

  private async identifierManagedGetByDid(
    args: ManagedIdentifierDidOpts,
    context: IAgentContext<IKeyManager & IDIDManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierDidResult> {
    return (await this.identifierManagedGet({ ...args, method: 'did' }, context)) as ManagedIdentifierDidResult
  }

  private async identifierManagedGetByKid(
    args: ManagedIdentifierKidOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierKidResult> {
    return (await this.identifierManagedGet({ ...args, method: 'kid' }, context)) as ManagedIdentifierKidResult
  }

  private async identifierManagedGetByKey(
    args: ManagedIdentifierKeyOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierKeyResult> {
    return (await this.identifierManagedGet({ ...args, method: 'key' }, context)) as ManagedIdentifierKeyResult
  }

  private async identifierManagedGetByCoseKey(
    args: ManagedIdentifierCoseKeyOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierCoseKeyResult> {
    return (await this.identifierManagedGet({ ...args, method: 'cose_key' }, context)) as ManagedIdentifierCoseKeyResult
  }

  private async identifierManagedGetByOID4VCIssuer(
    args: ManagedIdentifierOID4VCIssuerOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierOID4VCIssuerResult> {
    return (await this.identifierManagedGet({ ...args, method: 'oid4vci-issuer' }, context)) as ManagedIdentifierOID4VCIssuerResult
  }

  private async identifierManagedGetByJwk(
    args: ManagedIdentifierJwkOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierJwkResult> {
    return (await this.identifierManagedGet({ ...args, method: 'jwk' }, context)) as ManagedIdentifierJwkResult
  }

  private async identifierManagedGetByX5c(
    args: ManagedIdentifierX5cOpts,
    context: IAgentContext<IKeyManager & IIdentifierResolution>
  ): Promise<ManagedIdentifierX5cResult> {
    return (await this.identifierManagedGet({ ...args, method: 'x5c' }, context)) as ManagedIdentifierX5cResult
  }

  private async identifierExternalResolve(
    args: ExternalIdentifierOpts,
    context: IAgentContext<IKeyManager | IOIDFClient>
  ): Promise<ExternalIdentifierResult> {
    return await resolveExternalIdentifier({ ...args, crypto: this._crypto }, context)
  }

  private async identifierExternalResolveByDid(args: ExternalIdentifierDidOpts, context: IAgentContext<any>): Promise<ExternalIdentifierDidResult> {
    return (await this.identifierExternalResolve({ ...args, method: 'did' }, context)) as ExternalIdentifierDidResult
  }

  private async identifierExternalResolveByX5c(args: ExternalIdentifierX5cOpts, context: IAgentContext<any>): Promise<ExternalIdentifierX5cResult> {
    return (await this.identifierExternalResolve({ ...args, method: 'x5c' }, context)) as ExternalIdentifierX5cResult
  }

  private async identifierExternalResolveByCoseKey(
    args: ExternalIdentifierCoseKeyOpts,
    context: IAgentContext<any>
  ): Promise<ExternalIdentifierCoseKeyResult> {
    return (await this.identifierExternalResolve({ ...args, method: 'cose_key' }, context)) as ExternalIdentifierCoseKeyResult
  }

  private async identifierExternalResolveByJwk(args: ExternalIdentifierJwkOpts, context: IAgentContext<any>): Promise<ExternalIdentifierJwkResult> {
    return (await this.identifierExternalResolve({ ...args, method: 'jwk' }, context)) as ExternalIdentifierJwkResult
  }

  private async identifierExternalResolveByOIDFEntityId(
    args: ExternalIdentifierOIDFEntityIdOpts,
    context: IAgentContext<any>
  ): Promise<ExternalIdentifierOIDFEntityIdResult> {
    return (await this.identifierExternalResolve({ ...args, method: 'entity_id' }, context)) as ExternalIdentifierOIDFEntityIdResult
  }
}
