import { IOpSessionArgs, schema } from '../index'
import { IAgentPlugin } from '@veramo/core'
import { OpSession } from '../session'
import { v4 as uuidv4 } from 'uuid'

import {
  IDidAuthSiopOpAuthenticator,
  IGetSiopSessionArgs,
  IRegisterCustomApprovalForSiopArgs,
  IRemoveCustomApprovalForSiopArgs,
  IRemoveSiopSessionArgs,
  IRequiredContext,
} from '../types/IDidAuthSiopOpAuthenticator'
import { PresentationSignCallback, VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'

export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  readonly methods: IDidAuthSiopOpAuthenticator = {
    siopGetOPSession: this.siopGetOPSession.bind(this),
    siopRegisterOPSession: this.siopRegisterOPSession.bind(this),
    siopRemoveOPSession: this.siopRemoveOPSession.bind(this),
    siopRegisterOPCustomApproval: this.siopRegisterOPCustomApproval.bind(this),
    siopRemoveOPCustomApproval: this.siopRemoveOPCustomApproval.bind(this),
  }

  private readonly sessions: Map<string, OpSession>
  private readonly customApprovals: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>
  private readonly presentationSignCallback?: PresentationSignCallback

  constructor(
    presentationSignCallback?: PresentationSignCallback,
    customApprovals?: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>,
  ) {
    this.sessions = new Map<string, OpSession>()
    this.customApprovals = customApprovals || {}
    this.presentationSignCallback = presentationSignCallback
  }

  private async siopGetOPSession(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession> {
    // TODO add cleaning up sessions https://sphereon.atlassian.net/browse/MYC-143
    if (!this.sessions.has(args.sessionId)) {
      throw Error(`No session found for id: ${args.sessionId}`)
    }

    return this.sessions.get(args.sessionId)!
  }

  private async siopRegisterOPSession(args: Omit<IOpSessionArgs, 'context'>, context: IRequiredContext): Promise<OpSession> {
    const sessionId = args.sessionId || uuidv4()
    if (this.sessions.has(sessionId)) {
      return Promise.reject(new Error(`Session with id: ${args.sessionId} already present`))
    }
    const opts = { ...args, sessionId, context } as Required<IOpSessionArgs>
    if (!opts.op?.presentationSignCallback) {
      opts.op = { ...opts.op, presentationSignCallback: this.presentationSignCallback }
    }
    const session = await OpSession.init(opts)
    this.sessions.set(sessionId, session)
    return session
  }

  private async siopRemoveOPSession(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean> {
    return this.sessions.delete(args.sessionId)
  }

  private async siopRegisterOPCustomApproval(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void> {
    if (this.customApprovals[args.key] !== undefined) {
      return Promise.reject(new Error(`Custom approval with key: ${args.key} already present`))
    }

    this.customApprovals[args.key] = args.customApproval
  }

  private async siopRemoveOPCustomApproval(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.customApprovals[args.key]
  }
}
