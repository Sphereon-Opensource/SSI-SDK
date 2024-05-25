import { AuthorizationRequestState, AuthorizationResponsePayload, decodeUriAsJson, VerifiedAuthorizationResponse } from '@sphereon/did-auth-siop'
import { AuthorizationResponseStateStatus } from '@sphereon/did-auth-siop/dist/types/SessionManager'
import { getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { AdditionalClaims, CredentialMapper, ICredentialSubject, IVerifiableCredential } from '@sphereon/ssi-types'
import { OriginalVerifiablePresentation } from '@sphereon/ssi-types/dist'
import { IAgentPlugin } from '@veramo/core'
import {
  AuthorizationResponseStateWithVerifiedData,
  IAuthorizationRequestPayloads,
  ICreateAuthRequestArgs,
  IGetAuthRequestStateArgs,
  IGetAuthResponseStateArgs,
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
  }

  constructor(opts: ISiopv2RPOpts) {
    this.opts = opts // TODO should we pre-import all supplied presentation definitions here?
  }

  public setDefaultOpts(rpDefaultOpts: IRPDefaultOpts, context: IRequiredContext) {
    // We allow setting default options later, because in some cases you might want to query the agent for defaults. This cannot happen when the agent is being build (this is when the constructor is being called)
    this.opts.defaultOpts = rpDefaultOpts
    // We however do require the agent to be responsible for resolution, otherwise people might encounter strange errors, that are very hard to track down
    if (!this.opts.defaultOpts.didOpts.resolveOpts?.resolver || typeof this.opts.defaultOpts.didOpts.resolveOpts.resolver.resolve !== 'function') {
      this.opts.defaultOpts.didOpts.resolveOpts = {
        ...this.opts.defaultOpts.didOpts.resolveOpts,
        resolver: getAgentResolver(context, { uniresolverResolution: true, resolverResolution: true, localResolution: true }),
      }
    }
  }

  private async createAuthorizationRequestURI(createArgs: ICreateAuthRequestArgs, context: IRequiredContext): Promise<string> {
    return await this.getRPInstance({ definitionId: createArgs.definitionId }, context)
      .then((rp) => rp.createAuthorizationRequestURI(createArgs, context))
      .then((URI) => URI.encodedUri)
  }

  private async createAuthorizationRequestPayloads(
    createArgs: ICreateAuthRequestArgs,
    context: IRequiredContext,
  ): Promise<IAuthorizationRequestPayloads> {
    return await this.getRPInstance({ definitionId: createArgs.definitionId }, context)
      .then((rp) => rp.createAuthorizationRequest(createArgs, context))
      .then(async (request) => {
        const authRequest: IAuthorizationRequestPayloads = {
          authorizationRequest: request.payload,
          requestObject: await request.requestObjectJwt(),
          requestObjectDecoded: await request.requestObject?.getPayload(),
        }
        return authRequest
      })
  }

  private async siopGetRequestState(args: IGetAuthRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState | undefined> {
    return await this.getRPInstance({ definitionId: args.definitionId }, context).then((rp) =>
      rp.get(context).then((rp) => rp.sessionManager.getRequestStateByCorrelationId(args.correlationId, args.errorOnNotFound)),
    )
  }

  private async siopGetResponseState(
    args: IGetAuthResponseStateArgs,
    context: IRequiredContext,
  ): Promise<AuthorizationResponseStateWithVerifiedData | undefined> {
    const rpInstance = await this.getRPInstance({ definitionId: args.definitionId }, context).then((rp) =>
      rp.get(context).then((rp) => rp.sessionManager.getResponseStateByCorrelationId(args.correlationId, args.errorOnNotFound)),
    )
    if (rpInstance === undefined) {
      return undefined
    }

    const responseState = rpInstance as AuthorizationResponseStateWithVerifiedData
    if (
      responseState.status === AuthorizationResponseStateStatus.VERIFIED &&
      args.includeVerifiedData &&
      args.includeVerifiedData !== VerifiedDataMode.NONE
    ) {
      const presentationDecoded = CredentialMapper.decodeVerifiablePresentation(
        responseState.response.payload.vp_token as OriginalVerifiablePresentation,
      )
      const presentation = CredentialMapper.toUniformPresentation(presentationDecoded as OriginalVerifiablePresentation)
      switch (args.includeVerifiedData) {
        case VerifiedDataMode.VERIFIED_PRESENTATION:
          responseState.response.payload.verifiedData = presentation
          break
        case VerifiedDataMode.CREDENTIAL_SUBJECT_FLATTENED:
          const allClaims: AdditionalClaims = {}
          presentation.verifiableCredential?.forEach((credential) => {
            const vc = credential as IVerifiableCredential
            const credentialSubject = vc.credentialSubject as ICredentialSubject & AdditionalClaims
            if (!('id' in allClaims)) {
              allClaims['id'] = credentialSubject.id
            }

            Object.entries(credentialSubject).forEach(([key, value]) => {
              if (!(key in allClaims)) {
                allClaims[key] = value
              }
            })
          })
          responseState.verifiedData = allClaims
      }
    }
    return responseState
  }

  private async siopUpdateRequestState(args: IUpdateRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState> {
    if (args.state !== 'sent') {
      throw Error(`Only 'sent' status is supported for this method at this point`)
    }
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
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
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
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
    return await this.getRPInstance({ definitionId: args.definitionId }, context).then((rp) =>
      rp.get(context).then((rp) =>
        rp.verifyAuthorizationResponse(authResponse, {
          correlationId: args.correlationId,
          presentationDefinitions: args.presentationDefinitions,
          audience: args.audience,
        }),
      ),
    )
  }

  private async siopImportDefinitions(args: ImportDefinitionsArgs, context: IRequiredContext): Promise<void> {
    const { definitions, tenantId, version, versionControlMode } = args
    await Promise.all(
      definitions.map((definition) => {
        console.log(`persisting definition ${definition.id} / ${definition.name} with versionControlMode ${versionControlMode}`)
        return context.agent.pexStorePersistDefinition({
          definitionId: definition.id,
          definition: definition,
          tenantId: tenantId,
          validation: true,
          version: version,
          versionControlMode: versionControlMode,
        })
      }),
    )
  }

  async getRPInstance(args: ISiopRPInstanceArgs, context: IRequiredContext): Promise<RPInstance> {
    const definitionId = args.definitionId
    const instanceId = definitionId ?? SIOPv2RP._DEFAULT_OPTS_KEY
    if (!this.instances.has(instanceId)) {
      const instanceOpts = this.getInstanceOpts(definitionId)
      const rpOpts = await this.getRPOptions(context, { definitionId })
      if (!rpOpts.didOpts.resolveOpts?.resolver || typeof rpOpts.didOpts.resolveOpts.resolver.resolve !== 'function') {
        if (!rpOpts.didOpts?.resolveOpts) {
          rpOpts.didOpts = { ...rpOpts.didOpts }
          rpOpts.didOpts.resolveOpts = { ...rpOpts.didOpts.resolveOpts }
        }
        console.log('Using agent DID resolver for RP instance with definition id ' + args.definitionId)
        rpOpts.didOpts.resolveOpts.resolver = getAgentResolver(context, {
          uniresolverResolution: true,
          localResolution: true,
          resolverResolution: true,
        })
      }
      this.instances.set(instanceId, new RPInstance({ rpOpts, pexOpts: instanceOpts }))
    }
    return this.instances.get(instanceId)!
  }

  async getRPOptions(context: IRequiredContext, opts: { definitionId?: string }): Promise<IRPOptions> {
    const definitionId = opts.definitionId
    const options = this.getInstanceOpts(definitionId)?.rpOpts ?? this.opts.defaultOpts
    if (!options) {
      throw Error(`Could not get specific nor default options for definition ${definitionId}`)
    }
    if (this.opts.defaultOpts) {
      if (!options.didOpts) {
        options.didOpts = this.opts.defaultOpts?.didOpts
      } else {
        if (!options.didOpts.identifierOpts) {
          options.didOpts.identifierOpts = this.opts.defaultOpts.didOpts.identifierOpts
        }
        if (!options.didOpts.supportedDIDMethods) {
          options.didOpts.supportedDIDMethods = this.opts.defaultOpts.didOpts.supportedDIDMethods
        }
        if (!options.supportedVersions) {
          options.supportedVersions = this.opts.defaultOpts.supportedVersions
        }
      }
      if (!options.didOpts.resolveOpts || typeof options.didOpts.resolveOpts.resolver?.resolve !== 'function') {
        options.didOpts.resolveOpts = {
          ...this.opts.defaultOpts.didOpts.resolveOpts,
          resolver:
            this.opts.defaultOpts.didOpts?.resolveOpts?.resolver ??
            getAgentResolver(context, { localResolution: true, resolverResolution: true, uniresolverResolution: true }),
        }
      }
    }

    return options
  }

  getInstanceOpts(definitionId?: string): IPEXInstanceOptions | undefined {
    return definitionId ? this.opts.instanceOpts?.find((i) => i.definitionId === definitionId) : undefined
  }
}
