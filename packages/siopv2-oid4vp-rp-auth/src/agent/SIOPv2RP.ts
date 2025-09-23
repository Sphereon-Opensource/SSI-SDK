import {
  AuthorizationRequestState,
  AuthorizationResponsePayload,
  AuthorizationResponseState,
  AuthorizationResponseStateStatus,
  AuthorizationResponseStateWithVerifiedData,
  decodeUriAsJson,
  VerifiedAuthorizationResponse
} from '@sphereon/did-auth-siop'
import { getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { shaHasher as defaultHasher } from '@sphereon/ssi-sdk.core'
import type { ImportDcqlQueryItem } from '@sphereon/ssi-sdk.pd-manager'
import {
  AdditionalClaims,
  CredentialMapper,
  HasherSync,
  ICredentialSubject,
  IPresentation,
  IVerifiableCredential,
  IVerifiablePresentation,
  JwtDecodedVerifiablePresentation,
  MdocDeviceResponse,
  MdocOid4vpMdocVpToken,
  OriginalVerifiablePresentation,
  SdJwtDecodedVerifiableCredential,
} from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import { DcqlQuery } from 'dcql'
import {
  IAuthorizationRequestPayloads,
  ICreateAuthRequestArgs,
  IGetAuthRequestStateArgs,
  IGetAuthResponseStateArgs,
  IGetRedirectUriArgs,
  ImportDefinitionsArgs,
  IPEXInstanceOptions,
  IRequiredContext,
  IRPDefaultOpts,
  IRPOptions,
  ISiopRPInstanceArgs,
  ISiopv2RPOpts,
  IUpdateRequestStateArgs,
  IVerifyAuthResponseStateArgs,
  schema,
  VerifiedDataMode,
} from '../index'
import { RPInstance } from '../RPInstance'
import { ISIOPv2RP } from '../types/ISIOPv2RP'

export class SIOPv2RP implements IAgentPlugin {
  private readonly opts: ISiopv2RPOpts
  private static readonly _DEFAULT_OPTS_KEY = '_default'
  private readonly instances: Map<string, RPInstance> = new Map()
  readonly schema = schema.IDidAuthSiopOpAuthenticator

  readonly methods: ISIOPv2RP = {
    siopCreateAuthRequestURI: this.createAuthorizationRequestURI.bind(this),
    siopCreateAuthRequestPayloads: this.createAuthorizationRequestPayloads.bind(this),
    siopGetAuthRequestState: this.siopGetRequestState.bind(this),
    siopGetAuthResponseState: this.siopGetResponseState.bind(this),
    siopUpdateAuthRequestState: this.siopUpdateRequestState.bind(this),
    siopDeleteAuthState: this.siopDeleteState.bind(this),
    siopVerifyAuthResponse: this.siopVerifyAuthResponse.bind(this),
    siopImportDefinitions: this.siopImportDefinitions.bind(this),
    siopGetRedirectURI: this.siopGetRedirectURI.bind(this),
  }

  constructor(opts: ISiopv2RPOpts) {
    this.opts = opts
  }

  public setDefaultOpts(rpDefaultOpts: IRPDefaultOpts, context: IRequiredContext) {
    // We allow setting default options later, because in some cases you might want to query the agent for defaults. This cannot happen when the agent is being build (this is when the constructor is being called)
    this.opts.defaultOpts = rpDefaultOpts
    // We however do require the agent to be responsible for resolution, otherwise people might encounter strange errors, that are very hard to track down
    if (
      !this.opts.defaultOpts.identifierOpts.resolveOpts?.resolver ||
      typeof this.opts.defaultOpts.identifierOpts.resolveOpts.resolver.resolve !== 'function'
    ) {
      this.opts.defaultOpts.identifierOpts.resolveOpts = {
        ...this.opts.defaultOpts.identifierOpts.resolveOpts,
        resolver: getAgentResolver(context, { uniresolverResolution: true, resolverResolution: true, localResolution: true }),
      }
    }
  }

  private async createAuthorizationRequestURI(createArgs: ICreateAuthRequestArgs, context: IRequiredContext): Promise<string> {
    return await this.getRPInstance(
      { responseRedirectURI: createArgs.responseRedirectURI, ...(createArgs.useQueryIdInstance === true && { queryId: createArgs.queryId } ) },
      context,
    )
      .then((rp) => rp.createAuthorizationRequestURI(createArgs, context))
      .then((URI) => URI.encodedUri)
  }

  private async createAuthorizationRequestPayloads(
    createArgs: ICreateAuthRequestArgs,
    context: IRequiredContext,
  ): Promise<IAuthorizationRequestPayloads> {
    return await this.getRPInstance({ queryId: createArgs.queryId }, context)
      .then((rp) => rp.createAuthorizationRequest(createArgs, context))
      .then(async (request) => {
        const authRequest: IAuthorizationRequestPayloads = {
          authorizationRequest: request.payload,
          requestObject: await request.requestObjectJwt(),
          requestObjectDecoded: request.requestObject?.getPayload(),
        }
        return authRequest
      })
  }

  private async siopGetRequestState(args: IGetAuthRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState | undefined> {
    return await this.getRPInstance({ queryId: args.queryId }, context).then((rp) =>
      rp.get(context).then((rp) =>
        rp.sessionManager.getRequestStateByCorrelationId(args.correlationId, args.errorOnNotFound)
      ),
    )
  }

  private async siopGetResponseState(
    args: IGetAuthResponseStateArgs,
    context: IRequiredContext,
  ): Promise<AuthorizationResponseStateWithVerifiedData | undefined> {
    const rpInstance: RPInstance = await this.getRPInstance({ queryId: args.queryId }, context)
    const authorizationResponseState: AuthorizationResponseState | undefined = await rpInstance
      .get(context)
      .then((rp) => rp.sessionManager.getResponseStateByCorrelationId(args.correlationId, args.errorOnNotFound))
    if (authorizationResponseState === undefined) {
      return undefined
    }

    const responseState = authorizationResponseState as AuthorizationResponseStateWithVerifiedData
    if (
      responseState.status === AuthorizationResponseStateStatus.VERIFIED &&
      args.includeVerifiedData &&
      args.includeVerifiedData !== VerifiedDataMode.NONE
    ) {
      let hasher: HasherSync | undefined
      if (
        CredentialMapper.isSdJwtEncoded(responseState.response.payload.vp_token as OriginalVerifiablePresentation) &&
        (!rpInstance.rpOptions.credentialOpts?.hasher || typeof rpInstance.rpOptions.credentialOpts?.hasher !== 'function')
      ) {
        hasher = defaultHasher
      }
      // todo this should also include mdl-mdoc
      const presentationDecoded = CredentialMapper.decodeVerifiablePresentation(
        responseState.response.payload.vp_token as OriginalVerifiablePresentation,
        //todo: later we want to conditionally pass in options for mdl-mdoc here
        hasher,
      )
      switch (args.includeVerifiedData) {
        case VerifiedDataMode.VERIFIED_PRESENTATION:
          responseState.response.payload.verifiedData = this.presentationOrClaimsFrom(presentationDecoded)
          break
        case VerifiedDataMode.CREDENTIAL_SUBJECT_FLATTENED: // TODO debug cs-flat for SD-JWT
          const allClaims: AdditionalClaims = {}
          for (const credential of this.presentationOrClaimsFrom(presentationDecoded).verifiableCredential || []) {
            const vc = credential as IVerifiableCredential
            const schemaValidationResult = await context.agent.cvVerifySchema({
              credential,
              hasher,
              validationPolicy: rpInstance.rpOptions.verificationPolicies?.schemaValidation,
            })
            if (!schemaValidationResult.result) {
              responseState.status = AuthorizationResponseStateStatus.ERROR
              responseState.error = new Error(schemaValidationResult.error)
              return responseState
            }

            const credentialSubject = vc.credentialSubject as ICredentialSubject & AdditionalClaims
            if (!('id' in allClaims)) {
              allClaims['id'] = credentialSubject.id
            }

            Object.entries(credentialSubject).forEach(([key, value]) => {
              if (!(key in allClaims)) {
                allClaims[key] = value
              }
            })
          }
          responseState.verifiedData = allClaims
          break
      }
    }
    return responseState
  }

  private presentationOrClaimsFrom = (
    presentationDecoded:
      | JwtDecodedVerifiablePresentation
      | IVerifiablePresentation
      | SdJwtDecodedVerifiableCredential
      | MdocOid4vpMdocVpToken
      | MdocDeviceResponse,
  ): AdditionalClaims | IPresentation =>
    CredentialMapper.isSdJwtDecodedCredential(presentationDecoded)
      ? presentationDecoded.decodedPayload
      : CredentialMapper.toUniformPresentation(presentationDecoded as OriginalVerifiablePresentation)

  private async siopUpdateRequestState(args: IUpdateRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState> {
    if (args.state !== 'authorization_request_created') {
      throw Error(`Only 'authorization_request_created' status is supported for this method at this point`)
    }
    return await this.getRPInstance({ queryId: args.queryId }, context)
      // todo: In the SIOP library we need to update the signal method to be more like this method
      .then((rp) =>
        rp.get(context).then(async (rp) => {
          await rp.signalAuthRequestRetrieved({
            correlationId: args.correlationId,
            error: args.error ? new Error(args.error) : undefined,
          })
          return (await rp.sessionManager.getRequestStateByCorrelationId(args.correlationId, true)) as AuthorizationRequestState
        }),
      )
  }

  private async siopDeleteState(args: IGetAuthResponseStateArgs, context: IRequiredContext): Promise<boolean> {
    return await this.getRPInstance({ queryId: args.queryId }, context)
      .then((rp) => rp.get(context).then((rp) => rp.sessionManager.deleteStateForCorrelationId(args.correlationId)))
      .then(() => true)
  }

  private async siopVerifyAuthResponse(args: IVerifyAuthResponseStateArgs, context: IRequiredContext): Promise<VerifiedAuthorizationResponse> {
    if (!args.authorizationResponse) {
      throw Error('No SIOPv2 Authorization Response received')
    }
    const authResponse =
      typeof args.authorizationResponse === 'string'
        ? (decodeUriAsJson(args.authorizationResponse) as AuthorizationResponsePayload)
        : args.authorizationResponse
    return await this.getRPInstance({ queryId: args.queryId }, context).then((rp) =>
      rp.get(context).then((rp) =>
        rp.verifyAuthorizationResponse(authResponse, {
          correlationId: args.correlationId,
            ...(args.dcqlQuery ? { dcqlQuery: args.dcqlQuery } : {}),
            audience: args.audience,
        }),
      ),
    )
  }

  private async siopImportDefinitions(args: ImportDefinitionsArgs, context: IRequiredContext): Promise<void> {
    const { importItems, tenantId, version, versionControlMode } = args
    await Promise.all(
      importItems.map(async (importItem: ImportDcqlQueryItem) => {
        DcqlQuery.validate(importItem.query)
        console.log(`persisting DCQL definition ${importItem.queryId} with versionControlMode ${versionControlMode}`)

        return context.agent.pdmPersistDefinition({
          definitionItem: {
            queryId: importItem.queryId!,
            tenantId: tenantId,
            version: version,
            query: importItem.query,
          },
          opts: { versionControlMode: versionControlMode },
        })
      }),
    )
  }

  private async siopGetRedirectURI(args: IGetRedirectUriArgs, context: IRequiredContext): Promise<string | undefined> {
    const instanceId = args.queryId ?? SIOPv2RP._DEFAULT_OPTS_KEY
    if (this.instances.has(instanceId)) {
      const rpInstance = this.instances.get(instanceId)
      if (rpInstance !== undefined) {
        const rp = await rpInstance.get(context)
        return rp.getResponseRedirectUri({
          correlation_id: args.correlationId,
          correlationId: args.correlationId,
          ...(args.state && { state: args.state }),
        })
      }
    }
    return undefined
  }

  async getRPInstance({ queryId, responseRedirectURI }: ISiopRPInstanceArgs, context: IRequiredContext): Promise<RPInstance> {
    const instanceId = queryId ?? SIOPv2RP._DEFAULT_OPTS_KEY
    if (!this.instances.has(instanceId)) {
      const instanceOpts = this.getInstanceOpts(queryId)
      const rpOpts = await this.getRPOptions(context, { queryId, responseRedirectURI: responseRedirectURI })
      if (!rpOpts.identifierOpts.resolveOpts?.resolver || typeof rpOpts.identifierOpts.resolveOpts.resolver.resolve !== 'function') {
        if (!rpOpts.identifierOpts?.resolveOpts) {
          rpOpts.identifierOpts = { ...rpOpts.identifierOpts }
          rpOpts.identifierOpts.resolveOpts = { ...rpOpts.identifierOpts.resolveOpts }
        }
        console.log('Using agent DID resolver for RP instance with definition id ' + queryId)
        rpOpts.identifierOpts.resolveOpts.resolver = getAgentResolver(context, {
          uniresolverResolution: true,
          localResolution: true,
          resolverResolution: true,
        })
      }
      this.instances.set(instanceId, new RPInstance({ rpOpts, pexOpts: instanceOpts }))
    }
    const rpInstance = this.instances.get(instanceId)!
    if (responseRedirectURI) {
      rpInstance.rpOptions.responseRedirectUri = responseRedirectURI
    }
    return rpInstance
  }

  async getRPOptions(context: IRequiredContext, opts: { queryId?: string; responseRedirectURI?: string }): Promise<IRPOptions> {
    const { queryId, responseRedirectURI: responseRedirectURI } = opts
    const options = this.getInstanceOpts(queryId)?.rpOpts ?? this.opts.defaultOpts
    if (!options) {
      throw Error(`Could not get specific nor default options for definition ${queryId}`)
    }
    if (this.opts.defaultOpts) {
      if (!options.identifierOpts) {
        options.identifierOpts = this.opts.defaultOpts?.identifierOpts
      } else {
        if (!options.identifierOpts.idOpts) {
          options.identifierOpts.idOpts = this.opts.defaultOpts.identifierOpts.idOpts
        }
        if (!options.identifierOpts.supportedDIDMethods) {
          options.identifierOpts.supportedDIDMethods = this.opts.defaultOpts.identifierOpts.supportedDIDMethods
        }
        if (!options.supportedVersions) {
          options.supportedVersions = this.opts.defaultOpts.supportedVersions
        }
      }
      if (!options.identifierOpts.resolveOpts || typeof options.identifierOpts.resolveOpts.resolver?.resolve !== 'function') {
        options.identifierOpts.resolveOpts = {
          ...this.opts.defaultOpts.identifierOpts.resolveOpts,
          resolver:
            this.opts.defaultOpts.identifierOpts?.resolveOpts?.resolver ??
            getAgentResolver(context, { localResolution: true, resolverResolution: true, uniresolverResolution: true }),
        }
      }
    }
    if (responseRedirectURI !== undefined && responseRedirectURI !== options.responseRedirectUri) {
      options.responseRedirectUri = responseRedirectURI
    }
    return options
  }

  getInstanceOpts(definitionId?: string): IPEXInstanceOptions | undefined {
    if (!this.opts.instanceOpts) return undefined

    const instanceOpt = definitionId ? this.opts.instanceOpts.find((i) => i.queryId === definitionId) : undefined

    return instanceOpt ?? this.getDefaultOptions(definitionId)
  }

  private getDefaultOptions(definitionId: string | undefined) {
    if (!this.opts.instanceOpts) return undefined

    const defaultOptions = this.opts.instanceOpts.find((i) => i.queryId === 'default')
    if (defaultOptions) {
      const clonedOptions = { ...defaultOptions }
      if (definitionId !== undefined) {
        clonedOptions.queryId = definitionId
      }
      return clonedOptions
    }

    return undefined
  }
}
