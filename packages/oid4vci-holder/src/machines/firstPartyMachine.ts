import { assign, createMachine, DoneInvokeEvent, interpret } from 'xstate'
import { AuthorizationChallengeCodeResponse, AuthorizationChallengeError, AuthorizationChallengeErrorResponse } from '@sphereon/oid4vci-common'
import { DidAuthConfig } from '@sphereon/ssi-sdk.data-store-types'
import { CreateConfigResult } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { createConfig, getSiopRequest, sendAuthorizationChallengeRequest, sendAuthorizationResponse } from '../services/FirstPartyMachineServices'
import { translate } from '../localization/Localization'
import { ErrorDetails } from '../types/IOID4VCIHolder'
import {
  CreateConfigArgs,
  CreateFirstPartyMachineOpts,
  FirstPartyMachineContext,
  FirstPartyMachineEvents,
  FirstPartyMachineEventTypes,
  FirstPartyMachineInterpreter,
  FirstPartyMachineServices,
  FirstPartyMachineState,
  FirstPartyMachineStatesConfig,
  FirstPartyMachineStateTypes,
  FirstPartyMachineServiceDefinitions,
  FirstPartyStateMachine,
  GetSiopRequestArgs,
  InstanceFirstPartyMachineOpts,
  SiopV2AuthorizationRequestData,
  SendAuthorizationResponseArgs,
  FirstPartySelectCredentialsEvent,
} from '../types/FirstPartyMachine'

const firstPartyMachineStates: FirstPartyMachineStatesConfig = {
  [FirstPartyMachineStateTypes.sendAuthorizationChallengeRequest]: {
    id: FirstPartyMachineStateTypes.sendAuthorizationChallengeRequest,
    invoke: {
      src: FirstPartyMachineServices.sendAuthorizationChallengeRequest,
      onDone: {
        target: FirstPartyMachineStateTypes.done,
        actions: assign({
          authorizationCodeResponse: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<AuthorizationChallengeCodeResponse>) => _event.data,
        }),
      },
      onError: [
        {
          target: FirstPartyMachineStateTypes.createConfig,
          cond: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<AuthorizationChallengeErrorResponse>): boolean =>
            _event.data.error === AuthorizationChallengeError.insufficient_authorization,
          actions: assign({
            authSession: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<AuthorizationChallengeErrorResponse>) => _event.data.auth_session,
            presentationUri: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<AuthorizationChallengeErrorResponse>) =>
              _event.data.presentation,
          }),
        },
        {
          target: FirstPartyMachineStateTypes.error,
          actions: assign({
            error: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
              title: translate('oid4vci_machine_send_authorization_challenge_request_error_title'),
              message: _event.data.message,
              stack: _event.data.stack,
            }),
          }),
        },
      ],
    },
  },
  [FirstPartyMachineStateTypes.createConfig]: {
    id: FirstPartyMachineStateTypes.createConfig,
    invoke: {
      src: FirstPartyMachineServices.createConfig,
      onDone: {
        target: FirstPartyMachineStateTypes.getSiopRequest,
        actions: assign({
          didAuthConfig: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<DidAuthConfig>) => _event.data,
        }),
      },
      onError: {
        target: FirstPartyMachineStateTypes.error,
        actions: assign({
          error: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
            title: translate('oid4vci_machine_create_config_error_title'),
            message: _event.data.message,
            stack: _event.data.stack,
          }),
        }),
      },
    },
  },
  [FirstPartyMachineStateTypes.getSiopRequest]: {
    id: FirstPartyMachineStateTypes.getSiopRequest,
    invoke: {
      src: FirstPartyMachineServices.getSiopRequest,
      onDone: {
        target: FirstPartyMachineStateTypes.selectCredentials,
        actions: assign({
          authorizationRequestData: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<SiopV2AuthorizationRequestData>) => _event.data,
        }),
      },
      onError: {
        target: FirstPartyMachineStateTypes.error,
        actions: assign({
          error: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
            title: translate('siopV2_machine_get_request_error_title'),
            message: _event.data.message,
            stack: _event.data.stack,
          }),
        }),
      },
    },
  },
  [FirstPartyMachineStateTypes.selectCredentials]: {
    id: FirstPartyMachineStateTypes.selectCredentials,
    on: {
      [FirstPartyMachineEvents.SET_SELECTED_CREDENTIALS]: {
        actions: assign({ selectedCredentials: (_ctx: FirstPartyMachineContext, _event: FirstPartySelectCredentialsEvent) => _event.data }),
      },
      [FirstPartyMachineEvents.NEXT]: {
        target: FirstPartyMachineStateTypes.sendAuthorizationResponse,
      },
      [FirstPartyMachineEvents.DECLINE]: {
        target: FirstPartyMachineStateTypes.declined,
      },
      [FirstPartyMachineEvents.PREVIOUS]: {
        target: FirstPartyMachineStateTypes.aborted,
      },
    },
  },
  [FirstPartyMachineStateTypes.sendAuthorizationResponse]: {
    id: FirstPartyMachineStateTypes.sendAuthorizationResponse,
    invoke: {
      src: FirstPartyMachineServices.sendAuthorizationResponse,
      onDone: {
        target: FirstPartyMachineStateTypes.sendAuthorizationChallengeRequest,
        actions: assign({
          presentationDuringIssuanceSession: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<string>) => _event.data,
        }),
      },
      onError: {
        target: FirstPartyMachineStateTypes.error,
        actions: assign({
          error: (_ctx: FirstPartyMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
            title: translate('oid4vci_machine_get_request_error_title'),
            message: _event.data.message,
            stack: _event.data.stack,
          }),
        }),
      },
    },
  },
  [FirstPartyMachineStateTypes.aborted]: {
    id: FirstPartyMachineStateTypes.aborted,
    type: 'final',
  },
  [FirstPartyMachineStateTypes.declined]: {
    id: FirstPartyMachineStateTypes.declined,
    type: 'final',
  },
  [FirstPartyMachineStateTypes.error]: {
    id: FirstPartyMachineStateTypes.error,
    type: 'final',
  },
  [FirstPartyMachineStateTypes.done]: {
    id: FirstPartyMachineStateTypes.done,
    type: 'final',
  },
}

const createFirstPartyActivationMachine = (opts: CreateFirstPartyMachineOpts): FirstPartyStateMachine => {
  const initialContext: FirstPartyMachineContext = {
    openID4VCIClientState: opts.openID4VCIClientState,
    contact: opts.contact,
    selectedCredentials: [],
  }

  return createMachine<FirstPartyMachineContext, FirstPartyMachineEventTypes>({
    id: opts?.machineId ?? 'FirstParty',
    predictableActionArguments: true,
    initial: FirstPartyMachineStateTypes.sendAuthorizationChallengeRequest,
    context: initialContext,
    states: firstPartyMachineStates,
    schema: {
      events: {} as FirstPartyMachineEventTypes,
      services: {} as {
        [FirstPartyMachineServices.sendAuthorizationChallengeRequest]: {
          data: void
        }
        [FirstPartyMachineServices.createConfig]: {
          data: CreateConfigResult
        }
        [FirstPartyMachineServices.getSiopRequest]: {
          data: SiopV2AuthorizationRequestData
        }
        [FirstPartyMachineServices.sendAuthorizationResponse]: {
          data: string
        }
      },
    },
  })
}

export class FirstPartyMachine {
  private static _instance: FirstPartyMachineInterpreter | undefined

  static hasInstance(): boolean {
    return FirstPartyMachine._instance !== undefined
  }

  static get instance(): FirstPartyMachineInterpreter {
    if (!FirstPartyMachine._instance) {
      throw Error('Please initialize ESIMActivation machine first')
    }
    return FirstPartyMachine._instance
  }

  static clearInstance(opts: { stop: boolean }) {
    const { stop } = opts
    if (FirstPartyMachine.hasInstance()) {
      if (stop) {
        FirstPartyMachine.stopInstance()
      }
    }
    FirstPartyMachine._instance = undefined
  }

  static stopInstance(): void {
    if (!FirstPartyMachine.hasInstance()) {
      return
    }
    FirstPartyMachine.instance.stop()
    FirstPartyMachine._instance = undefined
  }

  public static newInstance(opts: InstanceFirstPartyMachineOpts): FirstPartyMachineInterpreter {
    const { agentContext } = opts
    const services: FirstPartyMachineServiceDefinitions = {
      [FirstPartyMachineServices.sendAuthorizationChallengeRequest]: sendAuthorizationChallengeRequest,
      [FirstPartyMachineServices.createConfig]: (args: CreateConfigArgs) => createConfig(args, agentContext),
      [FirstPartyMachineServices.getSiopRequest]: (args: GetSiopRequestArgs) => getSiopRequest(args, agentContext),
      [FirstPartyMachineServices.sendAuthorizationResponse]: (args: SendAuthorizationResponseArgs) => sendAuthorizationResponse(args, agentContext),
    }

    const newInst: FirstPartyMachineInterpreter = interpret(
      createFirstPartyActivationMachine(opts).withConfig({
        services: {
          ...services,
          ...opts?.services,
        },
        guards: {
          ...opts?.guards,
        },
      }),
    )

    if (typeof opts?.subscription === 'function') {
      newInst.onTransition(opts.subscription)
    }

    if (opts?.requireCustomNavigationHook !== true) {
      newInst.onTransition((snapshot: FirstPartyMachineState): void => {
        if (opts?.stateNavigationListener) {
          void opts.stateNavigationListener(newInst, snapshot)
        }
      })
    }

    return newInst
  }

  static getInstance(
    opts: InstanceFirstPartyMachineOpts & {
      requireExisting?: boolean
    },
  ): FirstPartyMachineInterpreter {
    if (!FirstPartyMachine._instance) {
      if (opts?.requireExisting === true) {
        throw Error(`Existing FirstPartyMachine instance requested, but none was created at this point!`)
      }
      FirstPartyMachine._instance = FirstPartyMachine.newInstance(opts)
    }
    return FirstPartyMachine._instance
  }
}
