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
  IGetDidSiopAuthenticationRequestDetailsArgs,
  IGetDidSiopAuthenticationRequestFromRpArgs,
  IGetDidSiopSessionArgs,
  IRegisterCustomApprovalForDidSiopArgs,
  IRemoveCustomApprovalForDidSiopArgs,
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
    addDidSiopSession: this.addSessionForDidSiop.bind(this),
    removeDidSiopSession: this.removeSessionForDidSiop.bind(this),
    authenticateWithDidSiop: this.authenticateWithDidSiop.bind(this),
    getDidSiopAuthenticationRequestFromRP: this.getDidSiopAuthenticationRequestFromRP.bind(this),
    getDidSiopAuthenticationRequestDetails: this.getDidSiopAuthenticationRequestDetails.bind(this),
    verifyDidSiopAuthenticationRequestURI: this.verifyDidSiopAuthenticationRequestURI.bind(this),
    sendDidSiopAuthenticationResponse: this.sendDidSiopAuthenticationResponse.bind(this),
    registerCustomApprovalForDidSiop: this.registerCustomApprovalForDidSiop.bind(this),
    removeCustomApprovalForDidSiop: this.removeCustomApprovalForDidSiop.bind(this)
  }

  private readonly sessions: Record<string, OperatingPartySession>
  private readonly customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>

  constructor(customApprovals?: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>) {
    this.sessions = {}
    this.customApprovals = customApprovals || {}
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

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.addSessionForDidSiop} */
  private async addSessionForDidSiop(
      args: ICreateDidSiopSessionArgs,
      context: IRequiredContext
  ): Promise<OperatingPartySession> {
    if (this.sessions[args.sessionId] !== undefined) {
      return Promise.reject(new Error(`Session with id: ${args.sessionId} already present`))
    }

    const sessionId = args.sessionId
    const session = new OperatingPartySession({sessionId, identifier: args.identifier, expiresIn: args.expiresIn, context})
    await session.init()
    this.sessions[sessionId] = session

    return session
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.removeSessionForDidSiop} */
  private async removeSessionForDidSiop(
      args: IRemoveDidSiopSessionArgs,
      context: IRequiredContext
  ): Promise<boolean> {
    return delete this.sessions[args.sessionId]
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerCustomApprovalForDidSiop} */
  private async registerCustomApprovalForDidSiop(
      args: IRegisterCustomApprovalForDidSiopArgs,
      context: IRequiredContext
  ): Promise<void> {
    if (this.customApprovals[args.key] !== undefined) {
      return Promise.reject(new Error(`Custom approval with key: ${args.key} already present`))
    }

    this.customApprovals[args.key] = args.customApproval
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerCustomApprovalForDidSiop} */
  private async removeCustomApprovalForDidSiop(
      args: IRemoveCustomApprovalForDidSiopArgs,
      context: IRequiredContext
  ): Promise<boolean> {
    return delete this.sessions[args.key]
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
