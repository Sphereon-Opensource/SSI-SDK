import { VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import { DidAuthConfig, Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { assign, createMachine, DoneInvokeEvent, interpret } from 'xstate'
import { translate } from '../localization/Localization'
import { ErrorDetails } from '../types'
import {
  ContactAliasEvent,
  ContactConsentEvent,
  CreateContactEvent,
  CreateSiopv2MachineOpts,
  SelectCredentialsEvent,
  Siopv2MachineAddContactStates,
  Siopv2MachineContext,
  Siopv2MachineEvents,
  Siopv2MachineEventTypes,
  Siopv2MachineGuards,
  Siopv2MachineInstanceOpts,
  Siopv2MachineInterpreter,
  Siopv2MachineServices,
  Siopv2MachineState,
  Siopv2MachineStates,
  Siopv2StateMachine,
} from '../types'
import { LOGGER_NAMESPACE, SelectableCredentialsMap, Siopv2AuthorizationRequestData, Siopv2AuthorizationResponseData } from '../types'
import { Loggers } from '@sphereon/ssi-types'

export const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)

const Siopv2HasNoContactGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { contact } = _ctx
  return contact === undefined
}

const Siopv2HasContactGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { contact } = _ctx
  return contact !== undefined
}

const Siopv2HasAuthorizationRequestGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { authorizationRequestData } = _ctx
  return authorizationRequestData !== undefined
}

const Siopv2HasSelectableCredentialsAndContactGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { authorizationRequestData, contact } = _ctx

  if (!authorizationRequestData) {
    throw new Error('Missing authorization request data in context')
  }
  if (!contact) {
    throw new Error('Missing contact request data in context')
  }

  return authorizationRequestData.presentationDefinitions !== undefined
}

const Siopv2CreateContactGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { contactAlias, hasContactConsent } = _ctx

  return hasContactConsent && contactAlias !== undefined && contactAlias.length > 0
}

const Siopv2HasSelectedRequiredCredentialsGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { authorizationRequestData } = _ctx

  if (authorizationRequestData === undefined) {
    throw new Error('Missing authorization request data in context')
  }

  if (authorizationRequestData.presentationDefinitions === undefined || authorizationRequestData.presentationDefinitions.length === 0) {
    throw Error('No presentation definitions present')
  }

  // FIXME: Return _ctx.selectedCredentials.length > 0 for now, given this is a really expensive operation and will be called in the next phase anyway
  return _ctx.selectedCredentials.length > 0
  /*const definitionWithLocation: PresentationDefinitionWithLocation = authorizationRequestData.presentationDefinitions[0];
        const pex: PEX = new PEX();
        const evaluationResults: EvaluationResults = pex.evaluateCredentials(definitionWithLocation.definition, selectedCredentials);

        return evaluationResults.areRequiredCredentialsPresent === Status.INFO;*/
}

const Siopv2IsSiopOnlyGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { authorizationRequestData } = _ctx

  if (authorizationRequestData === undefined) {
    throw new Error('Missing authorization request data in context')
  }

  return authorizationRequestData.presentationDefinitions === undefined
}

const Siopv2IsSiopWithOID4VPGuard = (_ctx: Siopv2MachineContext, _event: Siopv2MachineEventTypes): boolean => {
  const { authorizationRequestData, selectableCredentialsMap } = _ctx

  if (!authorizationRequestData) {
    throw new Error('Missing authorization request data in context')
  }

  if (!selectableCredentialsMap) {
    throw new Error('Missing selectableCredentialsMap in context')
  }

  return authorizationRequestData.presentationDefinitions !== undefined
}

const createSiopv2Machine = (opts: CreateSiopv2MachineOpts): Siopv2StateMachine => {
  const { url, idOpts } = opts
  const initialContext: Siopv2MachineContext = {
    url: new URL(url).toString(),
    hasContactConsent: true,
    contactAlias: '',
    selectedCredentials: [],
    idOpts: idOpts,
  }

  return createMachine<Siopv2MachineContext, Siopv2MachineEventTypes>({
    id: opts?.machineId ?? 'Siopv2',
    predictableActionArguments: true,
    initial: Siopv2MachineStates.createConfig,
    schema: {
      events: {} as Siopv2MachineEventTypes,
      guards: {} as
        | { type: Siopv2MachineGuards.hasNoContactGuard }
        | { type: Siopv2MachineGuards.hasContactGuard }
        | { type: Siopv2MachineGuards.createContactGuard }
        | { type: Siopv2MachineGuards.hasAuthorizationRequestGuard }
        | { type: Siopv2MachineGuards.hasSelectableCredentialsAndContactGuard }
        | { type: Siopv2MachineGuards.hasSelectedRequiredCredentialsGuard },
      services: {} as {
        [Siopv2MachineServices.createConfig]: {
          data: DidAuthConfig
        }
        [Siopv2MachineServices.getSiopRequest]: {
          data: VerifiedAuthorizationRequest
        }
        [Siopv2MachineServices.getSelectableCredentials]: {
          data: SelectableCredentialsMap
        }
        [Siopv2MachineServices.retrieveContact]: {
          data: Party | undefined
        }
        [Siopv2MachineServices.addContactIdentity]: {
          data: void
        }
        [Siopv2MachineServices.sendResponse]: {
          data: void
        }
      },
    },
    context: initialContext,
    states: {
      [Siopv2MachineStates.createConfig]: {
        id: Siopv2MachineStates.createConfig,
        invoke: {
          src: Siopv2MachineServices.createConfig,
          onDone: {
            target: Siopv2MachineStates.getSiopRequest,
            actions: assign({
              didAuthConfig: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<DidAuthConfig>) => _event.data,
            }),
          },
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_create_config_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },
      [Siopv2MachineStates.getSiopRequest]: {
        id: Siopv2MachineStates.getSiopRequest,
        invoke: {
          src: Siopv2MachineServices.getSiopRequest,
          onDone: {
            target: Siopv2MachineStates.retrieveContact,
            actions: assign({
              authorizationRequestData: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Siopv2AuthorizationRequestData>) => _event.data,
            }),
          },
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_get_request_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },
      [Siopv2MachineStates.retrieveContact]: {
        id: Siopv2MachineStates.retrieveContact,
        invoke: {
          src: Siopv2MachineServices.retrieveContact,
          onDone: {
            target: Siopv2MachineStates.transitionFromSetup,
            actions: assign({ contact: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Party>) => _event.data }),
          },
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_retrieve_contact_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },
      [Siopv2MachineStates.transitionFromSetup]: {
        id: Siopv2MachineStates.transitionFromSetup,
        always: [
          {
            target: Siopv2MachineStates.addContact,
            cond: Siopv2MachineGuards.hasNoContactGuard,
          },
          {
            target: Siopv2MachineStates.sendResponse,
            cond: Siopv2MachineGuards.siopOnlyGuard,
          },
          {
            target: Siopv2MachineStates.getSelectableCredentials,
            cond: Siopv2MachineGuards.hasSelectableCredentialsAndContactGuard,
          },
          {
            target: Siopv2MachineStates.selectCredentials,
            cond: Siopv2MachineGuards.siopWithOID4VPGuard,
          },
        ],
      },
      [Siopv2MachineStates.addContact]: {
        id: Siopv2MachineStates.addContact,
        initial: Siopv2MachineAddContactStates.idle,
        on: {
          [Siopv2MachineEvents.SET_CONTACT_CONSENT]: {
            actions: assign({ hasContactConsent: (_ctx: Siopv2MachineContext, _event: ContactConsentEvent) => _event.data }),
          },
          [Siopv2MachineEvents.SET_CONTACT_ALIAS]: {
            actions: assign({ contactAlias: (_ctx: Siopv2MachineContext, _event: ContactAliasEvent) => _event.data }),
          },
          [Siopv2MachineEvents.CREATE_CONTACT]: {
            target: `.${Siopv2MachineAddContactStates.next}`,
            actions: assign({ contact: (_ctx: Siopv2MachineContext, _event: CreateContactEvent) => _event.data }),
            cond: Siopv2MachineGuards.createContactGuard,
          },
          [Siopv2MachineEvents.DECLINE]: {
            target: Siopv2MachineStates.declined,
          },
          [Siopv2MachineEvents.PREVIOUS]: {
            target: Siopv2MachineStates.aborted,
          },
        },
        states: {
          [Siopv2MachineAddContactStates.idle]: {},
          [Siopv2MachineAddContactStates.next]: {
            always: {
              target: `#${Siopv2MachineStates.transitionFromSetup}`,
              cond: Siopv2MachineGuards.hasContactGuard,
            },
          },
        },
      },
      [Siopv2MachineStates.addContactIdentity]: {
        id: Siopv2MachineStates.addContactIdentity,
        invoke: {
          src: Siopv2MachineServices.addContactIdentity,
          onDone: [
            {
              target: Siopv2MachineStates.getSelectableCredentials,
              actions: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Identity>): void => {
                _ctx.contact?.identities.push(_event.data)
              },
              cond: Siopv2MachineGuards.hasSelectableCredentialsAndContactGuard,
            },
            {
              target: Siopv2MachineStates.sendResponse,
              actions: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Identity>): void => {
                _ctx.contact?.identities.push(_event.data)
              },
              cond: Siopv2MachineGuards.siopOnlyGuard,
            },
          ],
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_add_contact_identity_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },
      [Siopv2MachineStates.getSelectableCredentials]: {
        id: Siopv2MachineStates.getSelectableCredentials,
        invoke: {
          src: Siopv2MachineServices.getSelectableCredentials,
          onDone: {
            target: Siopv2MachineStates.selectCredentials,
            actions: assign({
              selectableCredentialsMap: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<SelectableCredentialsMap>) => _event.data,
            }),
          },
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_get_selectable_credentials_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },

      [Siopv2MachineStates.selectCredentials]: {
        id: Siopv2MachineStates.selectCredentials,
        on: {
          [Siopv2MachineEvents.SET_SELECTED_CREDENTIALS]: {
            actions: assign({ selectedCredentials: (_ctx: Siopv2MachineContext, _event: SelectCredentialsEvent) => _event.data }),
          },
          [Siopv2MachineEvents.NEXT]: {
            target: Siopv2MachineStates.sendResponse,
            cond: Siopv2MachineGuards.hasSelectedRequiredCredentialsGuard,
          },
          [Siopv2MachineEvents.DECLINE]: {
            target: Siopv2MachineStates.declined,
          },
          [Siopv2MachineEvents.PREVIOUS]: {
            target: Siopv2MachineStates.aborted,
          },
        },
      },
      [Siopv2MachineStates.sendResponse]: {
        id: Siopv2MachineStates.sendResponse,
        invoke: {
          src: Siopv2MachineServices.sendResponse,
          onDone: {
            target: Siopv2MachineStates.done,
            actions: assign({
              authorizationResponseData: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Siopv2AuthorizationResponseData>) => _event.data,
            }),
          },
          onError: {
            target: Siopv2MachineStates.handleError,
            actions: assign({
              error: (_ctx: Siopv2MachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('siopv2_machine_send_response_error_title'),
                message: _event.data.message,
                stack: _event.data.stack,
              }),
            }),
          },
        },
      },
      [Siopv2MachineStates.handleError]: {
        id: Siopv2MachineStates.handleError,
        on: {
          [Siopv2MachineEvents.NEXT]: {
            target: Siopv2MachineStates.error,
          },
          [Siopv2MachineEvents.PREVIOUS]: {
            target: Siopv2MachineStates.error,
          },
        },
      },
      [Siopv2MachineStates.aborted]: {
        id: Siopv2MachineStates.aborted,
        type: 'final',
      },
      [Siopv2MachineStates.declined]: {
        id: Siopv2MachineStates.declined,
        type: 'final',
      },
      [Siopv2MachineStates.error]: {
        id: Siopv2MachineStates.error,
        type: 'final',
      },
      [Siopv2MachineStates.done]: {
        id: Siopv2MachineStates.done,
        type: 'final',
      },
    },
  })
}

export class Siopv2Machine {
  static newInstance(opts: Siopv2MachineInstanceOpts): { interpreter: Siopv2MachineInterpreter } {
    logger.info('New Siopv2Machine instance')
    const interpreter: Siopv2MachineInterpreter = interpret(
      createSiopv2Machine(opts).withConfig({
        services: {
          ...opts?.services,
        },
        guards: {
          Siopv2HasNoContactGuard,
          Siopv2HasContactGuard,
          Siopv2HasAuthorizationRequestGuard,
          Siopv2HasSelectableCredentialsAndContactGuard,
          Siopv2HasSelectedRequiredCredentialsGuard,
          Siopv2IsSiopOnlyGuard,
          Siopv2IsSiopWithOID4VPGuard,
          Siopv2CreateContactGuard,
          ...opts?.guards,
        },
      }),
    )

    if (typeof opts?.subscription === 'function') {
      interpreter.onTransition(opts.subscription)
    }

    if (opts?.requireCustomNavigationHook !== true) {
      interpreter.onTransition((snapshot: Siopv2MachineState): void => {
        if (opts.stateNavigationListener !== undefined) {
          void opts.stateNavigationListener(interpreter, snapshot)
        }
      })
    }
    interpreter.onTransition((snapshot: Siopv2MachineState): void => {
      logger.info('onTransition to new state', snapshot.value)
    })

    return { interpreter }
  }
}
