import { schema } from '../index'
import { IAgentPlugin } from '@veramo/core'
import { OpSession } from '../session/OpSession';
import { v4 as uuidv4 } from 'uuid';
import {
  ParsedAuthenticationRequestURI,
  VerifiedAuthenticationRequestWithJWT,
} from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import {
  events,
  IAuthenticateWithSiopArgs,
  IAuthRequestDetails,
  IRegisterSiopSessionArgs,
  IDidAuthSiopOpAuthenticator,
  IGetSiopAuthenticationRequestDetailsArgs,
  IGetSiopAuthenticationRequestFromRpArgs,
  IGetSiopSessionArgs,
  IRegisterCustomApprovalForSiopArgs,
  IRemoveCustomApprovalForSiopArgs,
  IRemoveSiopSessionArgs,
  IRequiredContext,
  ISendSiopAuthenticationResponseArgs,
  IVerifySiopAuthenticationRequestUriArgs
} from '../types/IDidAuthSiopOpAuthenticator'

/**
 * {@inheritDoc IDidAuthSiopOpAuthenticator}
 */
export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  readonly methods: IDidAuthSiopOpAuthenticator = {
    getDidSiopSession: this.getSiopSession.bind(this),
    registerSessionForSiop: this.registerSessionForSiop.bind(this),
    removeDidSiopSession: this.removeSessionForiop.bind(this),
    authenticateWithDidSiop: this.authenticateWithSiop.bind(this),
    getDidSiopAuthenticationRequestFromRP: this.getSiopAuthenticationRequestFromRP.bind(this),
    getDidSiopAuthenticationRequestDetails: this.getSiopAuthenticationRequestDetails.bind(this),
    verifyDidSiopAuthenticationRequestURI: this.verifySiopAuthenticationRequestURI.bind(this),
    sendDidSiopAuthenticationResponse: this.sendSiopAuthenticationResponse.bind(this),
    registerCustomApprovalForDidSiop: this.registerCustomApprovalForSiop.bind(this),
    removeCustomApprovalForDidSiop: this.removeCustomApprovalForSiop.bind(this)
  }

  private readonly sessions: Record<string, OpSession>
  private readonly customApprovals: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>

  constructor(customApprovals?: Record<string, (verifiedAuthenticationRequest: VerifiedAuthenticationRequestWithJWT) => Promise<void>>) {
    this.sessions = {}
    this.customApprovals = customApprovals || {}
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getSiopSession} */
  private async getSiopSession(
      args: IGetSiopSessionArgs,
      context: IRequiredContext
  ): Promise<OpSession> {
    // TODO add cleaning up sessions https://sphereon.atlassian.net/browse/MYC-143
    if (this.sessions[args.sessionId] === undefined) {
      return Promise.reject(new Error(`No session found for id: ${args.sessionId}`))
    }

    return this.sessions[args.sessionId]
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerSessionForSiop} */
  private async registerSessionForSiop(
      args: IRegisterSiopSessionArgs,
      context: IRequiredContext
  ): Promise<OpSession> {
    const sessionId = args.sessionId || uuidv4()

    if (this.sessions[sessionId] !== undefined) {
      return Promise.reject(new Error(`Session with id: ${args.sessionId} already present`))
    }

    const session = new OpSession({sessionId, identifier: args.identifier, expiresIn: args.expiresIn, context})
    await session.init()
    this.sessions[sessionId] = session

    return session
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.removeSessionForiop} */
  private async removeSessionForiop(
      args: IRemoveSiopSessionArgs,
      context: IRequiredContext
  ): Promise<boolean> {
    return delete this.sessions[args.sessionId]
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerCustomApprovalForSiop} */
  private async registerCustomApprovalForSiop(
      args: IRegisterCustomApprovalForSiopArgs,
      context: IRequiredContext
  ): Promise<void> {
    if (this.customApprovals[args.key] !== undefined) {
      return Promise.reject(new Error(`Custom approval with key: ${args.key} already present`))
    }

    this.customApprovals[args.key] = args.customApproval
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.registerCustomApprovalForSiop} */
  private async removeCustomApprovalForSiop(
      args: IRemoveCustomApprovalForSiopArgs,
      context: IRequiredContext
  ): Promise<boolean> {
    return delete this.sessions[args.key]
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.authenticateWithSiop} */
  private async authenticateWithSiop(
      args: IAuthenticateWithSiopArgs,
      context: IRequiredContext
  ): Promise<Response> {
    return this.getSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.authenticateWithSiop({...args, customApprovals: this.customApprovals})
          .then(async (response: Response) => {
            await context.agent.emit(events.DID_SIOP_AUTHENTICATED, response)
            return response
          })
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getSiopAuthenticationRequestFromRP} */
  private async getSiopAuthenticationRequestFromRP(
      args: IGetSiopAuthenticationRequestFromRpArgs,
      context: IRequiredContext
  ): Promise<ParsedAuthenticationRequestURI> {
    return this.getSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.getSiopAuthenticationRequestFromRP(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.getSiopAuthenticationRequestDetails} */
  private async getSiopAuthenticationRequestDetails(
      args: IGetSiopAuthenticationRequestDetailsArgs,
      context: IRequiredContext
  ): Promise<IAuthRequestDetails> {
    return this.getSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.getSiopAuthenticationRequestDetails(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.verifySiopAuthenticationRequestURI} */
  private async verifySiopAuthenticationRequestURI(
      args: IVerifySiopAuthenticationRequestUriArgs,
      context: IRequiredContext
  ): Promise<VerifiedAuthenticationRequestWithJWT> {
    return this.getSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.verifySiopAuthenticationRequestURI(args)
    )
  }

  /** {@inheritDoc IDidAuthSiopOpAuthenticator.sendSiopAuthenticationResponse} */
  private async sendSiopAuthenticationResponse(
      args: ISendSiopAuthenticationResponseArgs,
      context: IRequiredContext
  ): Promise<Response> {
    return this.getSiopSession({sessionId: args.sessionId}, context).then(session =>
        session.sendSiopAuthenticationResponse(args)
        .then(async (response: Response) => {
          await context.agent.emit(events.DID_SIOP_AUTHENTICATED, response)
          return response
        })
    )
  }

}
