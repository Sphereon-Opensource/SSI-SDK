import {
  IAuthorizationRequestPayloads,
  ICreateAuthRequestArgs,
  IGetAuthRequestStateArgs,
  IGetAuthResponseStateArgs,
  IPEXInstanceOptions,
  IRequiredContext,
  IRPOptions,
  ISiopRPInstanceArgs,
  ISiopv2RPOpts, IUpdateRequestStateArgs, IVerifyAuthResponseStateArgs,
  schema,
} from '../index'
import { IAgentPlugin } from '@veramo/core'

import { ISIOPv2RP } from '../types/ISIOPv2RP'
import { RPInstance } from '../RPInstance'
import {
  AuthorizationRequestState,
  AuthorizationResponsePayload,
  VerifiedAuthorizationResponse,
} from '@sphereon/did-auth-siop/dist/main/types'
import { AuthorizationResponseState, decodeUriAsJson } from '@sphereon/did-auth-siop'
import { AuthorizationRequestStateStatus } from '@sphereon/ssi-sdk-siopv2-oid4vp-common'

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
  }

  constructor(opts: ISiopv2RPOpts) {
    this.opts = opts
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
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
      .then((rp) => rp.get(context).then(rp => rp.sessionManager.getRequestStateByCorrelationId(args.correlationId, args.errorOnNotFound)))
  }

  private async siopGetResponseState(args: IGetAuthResponseStateArgs, context: IRequiredContext): Promise<AuthorizationResponseState | undefined> {
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
      .then((rp) => rp.get(context).then(rp => rp.sessionManager.getResponseStateByCorrelationId(args.correlationId, args.errorOnNotFound)))
  }

  private async siopUpdateRequestState(args: IUpdateRequestStateArgs, context: IRequiredContext): Promise<AuthorizationRequestState> {
    if (args.state !== AuthorizationRequestStateStatus.SENT) {
      throw Error(`Only 'sent' status is support for this method at this point`)
    }
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
      // todo: In the SIOP library we need to update the signal method to be more like this method
      .then((rp) => rp.get(context).then(async rp => {
        await rp.signalAuthRequestRetrieved({
          correlationId: args.correlationId,
          error: args.error ? new Error(args.error) : undefined,
        })
        return await rp.sessionManager.getRequestStateByCorrelationId(args.correlationId, true) as AuthorizationRequestState
      }))

  }


  private async siopDeleteState(args: IGetAuthResponseStateArgs, context: IRequiredContext): Promise<boolean> {
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
      .then((rp) => rp.get(context).then(rp => rp.sessionManager.deleteStateForCorrelationId(args.correlationId))).then(() => true)
  }


  private async siopVerifyAuthResponse(args: IVerifyAuthResponseStateArgs, context: IRequiredContext): Promise<VerifiedAuthorizationResponse> {
    const authResponse = decodeUriAsJson(args.authorizationResponse) as AuthorizationResponsePayload
    return await this.getRPInstance({ definitionId: args.definitionId }, context)
      .then((rp) => rp.get(context).then(rp => rp.verifyAuthorizationResponse(authResponse, {
        correlationId: args.correlationId,
        presentationDefinitions: args.presentationDefinitions,
        audience: args.audience,
      })))
  }


  async getRPInstance(args: ISiopRPInstanceArgs, context: IRequiredContext): Promise<RPInstance> {
    const definitionId = args.definitionId
    const instanceId = definitionId ?? SIOPv2RP._DEFAULT_OPTS_KEY
    if (!this.instances.has(instanceId)) {
      const instanceOpts = this.getInstanceOpts(definitionId)
      const rpOpts = await this.getRPOptions(definitionId)

      /*const definition = args.definition ?? (definitionId ? await context.agent.pexStoreGetDefinition({
        definitionId,
        storeId,
        namespace: storeNamespace,
      }) : undefined)*/
      if (instanceOpts?.definition) {
        await context.agent.pexStorePersistDefinition({
          definitionId,
          definition: instanceOpts.definition,
          storeId: instanceOpts.storeId,
          namespace: instanceOpts.storeNamespace,
          validation: true,
        })
      }
      this.instances.set(instanceId, new RPInstance({ rpOpts, pexOpts: instanceOpts }))
    }
    return this.instances.get(instanceId)!
  }

  async getRPOptions(definitionId?: string): Promise<IRPOptions> {
    const options = this.getInstanceOpts(definitionId)?.rpOpts ?? this.opts.defaultOpts
    if (!options) {
      throw Error(`Could not get specific nor default options for definition ${definitionId}`)
    }
    return options
  }

  getInstanceOpts(definitionId?: string): IPEXInstanceOptions | undefined {
    return definitionId ? this.opts.instanceOpts?.find((i) => i.definitionId === definitionId) : undefined
  }
}
