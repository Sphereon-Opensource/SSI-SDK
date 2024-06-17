/**
 * {@inheritDoc ISiopv2Holder}
 */
import { IAgentPlugin } from '@veramo/core'
import {
  CreateConfigArgs,
  ISiopv2Holder,
  Siopv2Machine as Siopv2MachineId,
  RequiredContext,
  Siopv2HolderEvent,
  Siopv2HolderOptions,
  Siopv2MachineContext,
  Siopv2MachineInstanceOpts,
  GetSiopRequestArgs,
  Siopv2AuthorizationRequestData,
  RetrieveContactArgs,
  AddIdentityArgs,
  SendResponseArgs,
} from '../types/ISiopv2Holder'
import { Siopv2Machine } from '../machine/Siopv2Machine'

import { Loggers, LogMethod } from '@sphereon/ssi-types'
import { VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import { DidAuthConfig } from '@sphereon/ssi-sdk.data-store'
import { addContactIdentity, createConfig, getSiopRequest, retrieveContact, sendResponse } from './Siopv2HolderService'

// Exposing the methods here for any REST implementation
export const Siopv2HolderContextMethods: Array<string> = []

const logger = Loggers.DEFAULT.options('sphereon:Siopv2:holder', { methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG] }).get('sphereon:Siopv2:holder')

export class Siopv2Holder implements IAgentPlugin {
  readonly eventTypes: Array<Siopv2HolderEvent> = []

  readonly methods: ISiopv2Holder = {
    Siopv2HolderGetMachineInterpreter: this.Siopv2HolderGetMachineInterpreter.bind(this),
  }

  constructor(options?: Siopv2HolderOptions) {
    const {} = options ?? {}
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> {
    switch (event.type) {
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  private async Siopv2HolderGetMachineInterpreter(opts: Siopv2MachineInstanceOpts, context: RequiredContext): Promise<Siopv2MachineId> {
    //    const { stateNavigationListener, url } = args
    const services = {
      createConfig: (args: CreateConfigArgs) => createConfig(args),
      getSiopRequest: (args: GetSiopRequestArgs) => getSiopRequest(args, context),
      retrieveContact: (args: RetrieveContactArgs) => retrieveContact(args, context),
      addContactIdentity: (args: AddIdentityArgs) => addContactIdentity(args),
      sendResponse: (args: SendResponseArgs) => sendResponse(args, context),
      ...opts?.servces,
    }

    const Siopv2MachineOpts: Siopv2MachineInstanceOpts = {
      url,
      stateNavigationListener,
      services: {
        ...services,
        ...args.services,
      },
    }

    return Siopv2Machine.newInstance(Siopv2MachineOpts)
  }
}
