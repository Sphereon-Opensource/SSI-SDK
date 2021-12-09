import { schema } from '../index'
import { IAgentPlugin } from '@veramo/core'
import { OperatingPartySession } from '../session/OperatingPartySession';
import {
  ParsedAuthenticationRequestURI,
  VerifiedAuthenticationRequestWithJWT,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import {
  events,
  IAuthenticateWithDidSiopArgs,
  IAuthRequestDetails,
  ICreateDidSiopSessionArgs,
  IDidAuthSiopOpAuthenticator,
  IDidAuthSiopOpAuthenticatorArgs,
  IGetDidSiopAuthenticationRequestDetailsArgs,
  IGetDidSiopAuthenticationRequestFromRpArgs,
  IGetDidSiopSessionArgs,
  IRegisterCustomApprovalForDidSiopArgs,
  IRemoveDidSiopSessionArgs,
  IRequiredContext,
  ISendDidSiopAuthenticationResponseArgs,
  IVerifyDidSiopAuthenticationRequestUriArgs
} from '../types/IDidAuthSiopOpAuthenticator'

/**
 * {@inheritDoc IDidAuthSiopOpAuthenticator}
 */
export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  readonly methods: IDidAuthSiopOpAuthenticator = {
    getDidSiopSession: this.getDidSiopSession.bind(this),
    addDidSiopSession: this.addDidSiopSession.bind(this),
    removeDidSiopSession: this.removeDidSiopSession.bind(this),
    authenticateWithDidSiop: this.authenticateWithDidSiop.bind(this),
    getDidSiopAuthenticationRequestFromRP: this.getDidSiopAuthenticationRequestFromRP.bind(this),
    getDidSiopAuthenticationRequestDetails: this.getDidSiopAuthenticationRequestDetails.bind(this),
    verifyDidSiopAuthenticationRequestURI: this.verifyDidSiopAuthenticationRequestURI.bind(this),
    sendDidSiopAuthenticationResponse: this.sendDidSiopAuthenticationResponse.bind(this),
    registerCustomApprovalForDidSiop: this.registerCustomApprovalForDidSiop.bind(this),
  }

  private readonly sessions: Record<string, OperatingPartySession>
  private readonly customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>

  constructor(options: IDidAuthSiopOpAuthenticatorArgs) {
    this.sessions = {}
    this.customApprovals = options.customApprovals || {}
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getSession} */
  private async getDidSiopSession(
      args: IGetDidSiopSessionArgs,
      context: IRequiredContext
  ): Promise<OperatingPartySession> {
    if (this.sessions[args.sessionId] === undefined) {
      return Promise.reject(new Error(`No session found for id: ${args.sessionId}`))
    }

    return this.sessions[args.sessionId]
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.addDidSiopSession} */
  private async addDidSiopSession(
      args: ICreateDidSiopSessionArgs,
      context: IRequiredContext
  ): Promise<OperatingPartySession> {
    const sessionId = args.sessionId
    const session = new OperatingPartySession({identifier: args.identifier, expiresIn: args.expiresIn, context})
    await session.init() // TODO maybe a builder to be able to async functions?
    this.sessions[sessionId] = session

    return session
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.removeDidSiopSession} */
  private async removeDidSiopSession(
      args: IRemoveDidSiopSessionArgs,
      context: IRequiredContext
  ): Promise<void> {
    this.getDidSiopSession({sessionId: args.sessionId}, context).then(() =>
        delete this.sessions[args.sessionId]
    )
  }

  // TODO update / edit session?

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerCustomApprovalForDidSiop} */
  private async registerCustomApprovalForDidSiop(
      args: IRegisterCustomApprovalForDidSiopArgs,
      context: IRequiredContext
  ): Promise<void> {
    this.customApprovals[args.key] = args.customApproval
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.authenticateWithDidSiop} */
  private async authenticateWithDidSiop(
      args: IAuthenticateWithDidSiopArgs,
      context: IRequiredContext
  ): Promise<Response> {
    return this.getDidSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.authenticateWithDidSiop({...args, customApprovals: this.customApprovals})
          .then(async (response: Response) => {
            await context.agent.emit(events.DID_SIOP_AUTHENTICATED, response)
            return response
          })
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getDidSiopAuthenticationRequestFromRP} */
  private async getDidSiopAuthenticationRequestFromRP(
      args: IGetDidSiopAuthenticationRequestFromRpArgs,
      context: IRequiredContext
  ): Promise<ParsedAuthenticationRequestURI> {
    return this.getDidSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.getDidSiopAuthenticationRequestFromRP(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getDidSiopAuthenticationRequestDetails} */
  private async getDidSiopAuthenticationRequestDetails(
      args: IGetDidSiopAuthenticationRequestDetailsArgs,
      context: IRequiredContext
  ): Promise<IAuthRequestDetails> {
    return this.getDidSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.getDidSiopAuthenticationRequestDetails(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.verifyDidSiopAuthenticationRequestURI} */
  private async verifyDidSiopAuthenticationRequestURI(
      args: IVerifyDidSiopAuthenticationRequestUriArgs,
      context: IRequiredContext
  ): Promise<VerifiedAuthenticationRequestWithJWT> {
    return this.getDidSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.verifyDidSiopAuthenticationRequestURI(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.sendDidSiopAuthenticationResponse} */
  private async sendDidSiopAuthenticationResponse(
      args: ISendDidSiopAuthenticationResponseArgs,
      context: IRequiredContext
  ): Promise<Response> {
    return this.getDidSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.sendDidSiopAuthenticationResponse(args)
        .then(async (response: Response) => {
          await context.agent.emit(events.DID_SIOP_AUTHENTICATED, response)
          return response
        })
    )
  }

}
