import {
  AccessTokenResponse,
  AuthorizationServerMetadata,
  CredentialResponse,
  IssuerMetadata,
  OpenIDResponse,
  WellKnownEndpoints,
} from '@sphereon/oid4vci-common'
import { assertValidAccessTokenRequest, createAccessTokenResponse, VcIssuer } from '@sphereon/oid4vci-issuer'
import { retrieveWellknown } from '@sphereon/oid4vci-client'
import { getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { IMetadataOptions } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import { IAgentPlugin } from '@veramo/core'
import { getAccessTokenSignerCallback } from '../functions'
import {
  IAssertValidAccessTokenArgs,
  ICreateCredentialOfferURIResult,
  ICreateOfferArgs,
  IIssueCredentialArgs,
  IIssuerInstanceArgs,
  IIssuerOptions,
  IOID4VCIIssuerOpts,
  IRequiredContext,
  schema,
} from '../index'
import { IssuerInstance } from '../IssuerInstance'

import { IOID4VCIIssuer } from '../types/IOID4VCIIssuer'

export class OID4VCIIssuer implements IAgentPlugin {
  private static readonly _DEFAULT_OPTS_KEY = '_default'
  private readonly instances: Map<string, IssuerInstance> = new Map()
  readonly schema = schema.IDidAuthSiopOpAuthenticator

  readonly methods: IOID4VCIIssuer = {
    oid4vciCreateOfferURI: this.oid4vciCreateOfferURI.bind(this),
    oid4vciIssueCredential: this.oid4vciIssueCredential.bind(this),
    oid4vciCreateAccessTokenResponse: this.oid4vciCreateAccessTokenResponse.bind(this),
    oid4vciGetInstance: this.oid4vciGetInstance.bind(this),
  }
  private _opts: IOID4VCIIssuerOpts

  constructor(opts?: IOID4VCIIssuerOpts) {
    this._opts = opts ?? {}
  }

  private async oid4vciCreateOfferURI(createArgs: ICreateOfferArgs, context: IRequiredContext): Promise<ICreateCredentialOfferURIResult> {
    return await this.oid4vciGetInstance(createArgs, context)
      .then((instance) => instance.get({ context }))
      .then((issuer: VcIssuer) =>
        issuer.createCredentialOfferURI(createArgs).then((response) => {
          const result: ICreateCredentialOfferURIResult = response
          if (this._opts.returnSessions === false) {
            delete result.session
          }
          return result
        }),
      )
  }

  private async oid4vciIssueCredential(issueArgs: IIssueCredentialArgs, context: IRequiredContext): Promise<CredentialResponse> {
    return await this.oid4vciGetInstance(issueArgs, context)
      .then((instance) => instance.get({ context }))
      .then((issuer: VcIssuer) => issuer.issueCredential(issueArgs))
  }

  private async oid4vciCreateAccessTokenResponse(
    accessTokenArgs: IAssertValidAccessTokenArgs,
    context: IRequiredContext,
  ): Promise<AccessTokenResponse> {
    return await this.oid4vciGetInstance(accessTokenArgs, context).then(async (instance) => {
      const issuer = await instance.get({ context })

      await assertValidAccessTokenRequest(accessTokenArgs.request, {
        credentialOfferSessions: issuer.credentialOfferSessions,
        expirationDuration: accessTokenArgs.expirationDuration,
      })
      const accessTokenIssuer = instance.issuerOptions.idOpts?.issuer ?? instance.issuerOptions.didOpts?.idOpts.identifier.toString() // last part is legacy
      if (!accessTokenIssuer) {
        return Promise.reject(Error(`Could not determine access token issuer`))
      }
      return createAccessTokenResponse(accessTokenArgs.request, {
        accessTokenIssuer,
        tokenExpiresIn: accessTokenArgs.expirationDuration,
        cNonceExpiresIn: accessTokenArgs.expirationDuration,
        cNonces: issuer.cNonces,
        credentialOfferSessions: issuer.credentialOfferSessions,
        accessTokenSignerCallback: await getAccessTokenSignerCallback(instance.issuerOptions, context),
      })
    })
  }

  private getExternalAS(issuerMetadata: IssuerMetadata): string | undefined {
    if ('authorization_servers' in issuerMetadata && Array.isArray(issuerMetadata.authorization_servers)) {
      return issuerMetadata.authorization_servers.find((as) => as !== issuerMetadata.credential_issuer)
    }
    return undefined
  }

  private async createIssuerInstance(args: IIssuerInstanceArgs, context: IRequiredContext): Promise<IssuerInstance> {
    const credentialIssuer = args.credentialIssuer ?? OID4VCIIssuer._DEFAULT_OPTS_KEY
    //todo: prob doesn't make sense as credentialIssuer is mandatory anyway

    const metadataOpts = await this.getMetadataOpts({ ...args, credentialIssuer }, context)
    const issuerMetadata = await this.getIssuerMetadata({ ...args, credentialIssuer }, context)
    const externalAS = this.getExternalAS(issuerMetadata)
    let asMetadataResponse: OpenIDResponse<AuthorizationServerMetadata> | undefined = undefined
    if (externalAS) {
      // Let's try OIDC first and then fallback to OAuth2
      asMetadataResponse = await retrieveWellknown(externalAS, WellKnownEndpoints.OPENID_CONFIGURATION, {
        errorOnNotFound: false,
      })
      if (!asMetadataResponse) {
        asMetadataResponse = await retrieveWellknown(externalAS, WellKnownEndpoints.OAUTH_AS, {
          errorOnNotFound: true,
        })
      }
    }
    const authorizationServerMetadata = asMetadataResponse?.successBody
      ? asMetadataResponse!.successBody
      : await this.getAuthorizationServerMetadataFromStore(
          {
            ...args,
            credentialIssuer,
          },
          context,
        )
    const issuerOpts = await this.getIssuerOptsFromStore({ ...args, credentialIssuer }, context)
    if (!issuerOpts.resolveOpts) {
      issuerOpts.resolveOpts = { ...issuerOpts.didOpts?.resolveOpts, ...this._opts.resolveOpts }
    }
    if (!issuerOpts.resolveOpts?.resolver) {
      issuerOpts.resolveOpts.resolver = getAgentResolver(context)
    }
    this.instances.set(
      credentialIssuer,
      new IssuerInstance({
        issuerOpts,
        metadataOpts,
        issuerMetadata,
        authorizationServerMetadata,
      }),
    )
    return this.oid4vciGetInstance(args, context)
  }

  public async oid4vciGetInstance(args: IIssuerInstanceArgs, context: IRequiredContext): Promise<IssuerInstance> {
    const credentialIssuer = args.credentialIssuer ?? OID4VCIIssuer._DEFAULT_OPTS_KEY
    //todo: prob doesn't make sense as credentialIssuer is mandatory anyway
    if (!this.instances.has(credentialIssuer)) {
      await this.createIssuerInstance(args, context)
    }
    return this.instances.get(credentialIssuer)!
  }

  private async getIssuerOptsFromStore(
    opts: {
      credentialIssuer: string
      storeId?: string
      namespace?: string
    },
    context: IRequiredContext,
  ): Promise<IIssuerOptions> {
    const credentialIssuer = opts.credentialIssuer
    const storeId = await this.storeId(opts, context)
    const namespace = await this.namespace(opts, context)
    const options = await context.agent.oid4vciStoreGetIssuerOpts({
      metadataType: 'issuer',
      correlationId: credentialIssuer,
      storeId,
      namespace,
    })
    if (!options) {
      throw Error(`Could not get specific nor default options for definition ${credentialIssuer}`)
    }
    return options
  }

  private async getMetadataOpts(
    opts: {
      credentialIssuer: string
      storeId?: string
      namespace?: string
    },
    context: IRequiredContext,
  ): Promise<IMetadataOptions> {
    const credentialIssuer = opts.credentialIssuer
    const storeId = await this.storeId(opts, context)
    const storeNamespace = await this.namespace(opts, context)
    return { credentialIssuer, storeId, storeNamespace }
  }

  private async getIssuerMetadata(
    opts: {
      credentialIssuer: string
      storeId?: string
      namespace?: string
    },
    context: IRequiredContext,
  ): Promise<IssuerMetadata> {
    const metadataOpts = await this.getMetadataOpts(opts, context)
    const metadata = (await context.agent.oid4vciStoreGetMetadata({
      metadataType: 'issuer',
      correlationId: metadataOpts.credentialIssuer,
      namespace: metadataOpts.storeNamespace,
      storeId: metadataOpts.storeId,
    })) as IssuerMetadata
    if (!metadata) {
      throw Error(`Issuer metadata not found for issuer ${opts.credentialIssuer}, namespace ${opts.namespace} and store ${opts.storeId}`)
    }
    return metadata
  }

  private async getAuthorizationServerMetadataFromStore(
    opts: {
      credentialIssuer: string
      storeId?: string
      namespace?: string
    },
    context: IRequiredContext,
  ): Promise<AuthorizationServerMetadata> {
    const metadataOpts = await this.getMetadataOpts(opts, context)
    const metadata = (await context.agent.oid4vciStoreGetMetadata({
      metadataType: 'authorizationServer',
      correlationId: metadataOpts.credentialIssuer,
      namespace: metadataOpts.storeNamespace,
      storeId: metadataOpts.storeId,
    })) as AuthorizationServerMetadata
    if (!metadata) {
      throw Error(
        `Authorization server ${opts.credentialIssuer} metadata  not found for namespace ${metadataOpts.storeNamespace} and store ${metadataOpts.storeId}`,
      )
    }
    return metadata
  }

  private async storeId(opts?: { storeId?: string }, context?: IRequiredContext): Promise<string> {
    const storeId = opts?.storeId ?? this._opts?.defaultStoreId ?? (await context?.agent.oid4vciStoreDefaultStoreId())
    if (!storeId) {
      throw Error('Please provide a store id a default value, or provide the context for a global default store id')
    }
    return storeId
  }

  private async namespace(opts?: { namespace?: string }, context?: IRequiredContext): Promise<string> {
    const namespace = opts?.namespace ?? this._opts?.defaultNamespace ?? (await context?.agent.oid4vciStoreDefaultNamespace())
    if (!namespace) {
      throw Error('Please provide a namespace a default value, or provide the context for a global default namespace')
    }
    return namespace
  }
}
