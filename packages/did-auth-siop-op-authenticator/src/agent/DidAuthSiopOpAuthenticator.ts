import { schema } from '../index'
import { IAgentPlugin } from '@veramo/core'
import { OpSession } from '../session/OpSession'
import { v4 as uuidv4 } from 'uuid'

import {
  events,
  IAuthenticateWithSiopArgs,
  IAuthRequestDetails,
  IRegisterSiopSessionArgs,
  IDidAuthSiopOpAuthenticator,
  IGetSiopAuthorizationRequestDetailsArgs,
  IGetSiopAuthorizationRequestFromRpArgs,
  IGetSiopSessionArgs,
  IRegisterCustomApprovalForSiopArgs,
  IRemoveCustomApprovalForSiopArgs,
  IRemoveSiopSessionArgs,
  IRequiredContext,
  ISendSiopAuthorizationResponseArgs,
  IVerifySiopAuthorizationRequestUriArgs,
} from '../types/IDidAuthSiopOpAuthenticator'
import { VerifiedAuthorizationRequest, ParsedAuthorizationRequestURI, PresentationSignCallback } from '@sphereon/did-auth-siop'

export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  readonly methods: IDidAuthSiopOpAuthenticator = {
    getSessionForSiop: this.getSessionForSiop.bind(this),
    registerSessionForSiop: this.registerSessionForSiop.bind(this),
    removeSessionForSiop: this.removeSessionForSiop.bind(this),
    authenticateWithSiop: this.authenticateWithSiop.bind(this),
    getSiopAuthorizationRequestFromRP: this.getSiopAuthorizationRequestFromRP.bind(this),
    getSiopAuthorizationRequestDetails: this.getSiopAuthorizationRequestDetails.bind(this),
    verifySiopAuthorizationRequestURI: this.verifySiopAuthorizationRequestURI.bind(this),
    sendSiopAuthorizationResponse: this.sendSiopAuthorizationResponse.bind(this),
    registerCustomApprovalForSiop: this.registerCustomApprovalForSiop.bind(this),
    removeCustomApprovalForSiop: this.removeCustomApprovalForSiop.bind(this),
  }

  private readonly sessions: Record<string, OpSession>
  private readonly customApprovals: Record<
    string,
    (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>
  >
  private readonly presentationSignCallback: PresentationSignCallback;

  constructor(
      presentationSignCallback: PresentationSignCallback,
      customApprovals?: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>,
  ) {
    this.sessions = {};
    this.customApprovals = customApprovals || {};
    this.presentationSignCallback = presentationSignCallback;
  }

  private async getSessionForSiop(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession> {
    // TODO add cleaning up sessions https://sphereon.atlassian.net/browse/MYC-143
    if (this.sessions[args.sessionId] === undefined) {
      return Promise.reject(new Error(`No session found for id: ${args.sessionId}`))
    }

    return this.sessions[args.sessionId]
  }

  private async registerSessionForSiop(args: IRegisterSiopSessionArgs, context: IRequiredContext): Promise<OpSession> {
    const sessionId = args.sessionId || uuidv4()

    if (this.sessions[sessionId] !== undefined) {
      return Promise.reject(new Error(`Session with id: ${args.sessionId} already present`))
    }

    const session = new OpSession({
      sessionId,
      identifier: args.identifier,
      expiresIn: args.expiresIn,
      resolver: args.resolver,
      perDidResolvers: args.perDidResolvers,
      supportedDidMethods: args.supportedDidMethods,
      context,
    })
    await session.init()
    this.sessions[sessionId] = session

    return session
  }

  private async removeSessionForSiop(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.sessions[args.sessionId]
  }

  private async registerCustomApprovalForSiop(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void> {
    if (this.customApprovals[args.key] !== undefined) {
      return Promise.reject(new Error(`Custom approval with key: ${args.key} already present`))
    }

    this.customApprovals[args.key] = args.customApproval
  }

  private async removeCustomApprovalForSiop(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.sessions[args.key]
  }

  private async authenticateWithSiop(args: IAuthenticateWithSiopArgs, context: IRequiredContext): Promise<Response> {
    return this.getSessionForSiop({ sessionId: args.sessionId }, context).then((session) =>
      session.authenticateWithSiop({ ...args, customApprovals: this.customApprovals }).then(async (response: Response) => {
        await context.agent.emit(events.DID_SIOP_AUTHORIZED, response)
        return response
      })
    )
  }

  private async getSiopAuthorizationRequestFromRP(
    args: IGetSiopAuthorizationRequestFromRpArgs,
    context: IRequiredContext
  ): Promise<ParsedAuthorizationRequestURI> {
    return this.getSessionForSiop({ sessionId: args.sessionId }, context).then((session) => session.getSiopAuthorizationRequestFromRP(args))
  }

  private async getSiopAuthorizationRequestDetails(
    args: IGetSiopAuthorizationRequestDetailsArgs,
    context: IRequiredContext
  ): Promise<IAuthRequestDetails> {
    return this.getSessionForSiop(
        {
          sessionId: args.sessionId
        },
        context
    ).then(
        (session) => session.getSiopAuthorizationRequestDetails(args, this.presentationSignCallback)
    )
  }

  private async verifySiopAuthorizationRequestURI(
    args: IVerifySiopAuthorizationRequestUriArgs,
    context: IRequiredContext
  ): Promise<VerifiedAuthorizationRequest> {
    return this.getSessionForSiop({ sessionId: args.sessionId }, context).then((session) => session.verifySiopAuthorizationRequestURI(args))
  }

  private async sendSiopAuthorizationResponse(args: ISendSiopAuthorizationResponseArgs, context: IRequiredContext): Promise<Response> {
    return this.getSessionForSiop({ sessionId: args.sessionId }, context).then((session) =>
      session.sendSiopAuthorizationResponse(args).then(async (response: Response) => {
        await context.agent.emit(events.DID_SIOP_AUTHORIZED, response)
        return response
      })
    )
  }
}
