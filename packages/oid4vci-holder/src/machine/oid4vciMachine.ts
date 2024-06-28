import { AuthzFlowType, toAuthorizationResponsePayload } from '@sphereon/oid4vci-common'
import { Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { assign, createMachine, DoneInvokeEvent, interpret } from 'xstate'
import { translate } from '../localization/Localization'
import {
  AuthorizationResponseEvent,
  ContactAliasEvent,
  ContactConsentEvent,
  CreateContactEvent,
  CreateOID4VCIMachineOpts,
  CredentialTypeSelection,
  ErrorDetails,
  InitiationData,
  MappedCredentialToAccept,
  OID4VCIMachineAddContactStates,
  OID4VCIMachineContext,
  OID4VCIMachineEvents,
  OID4VCIMachineEventTypes,
  OID4VCIMachineGuards,
  OID4VCIMachineInstanceOpts,
  OID4VCIMachineInterpreter,
  OID4VCIMachineServices,
  OID4VCIMachineState,
  OID4VCIMachineStates,
  OID4VCIMachineVerifyPinStates,
  OID4VCIStateMachine,
  RequiredContext,
  SelectCredentialsEvent,
  SetAuthorizationCodeURLEvent,
  VerificationCodeEvent,
} from '../types/IOID4VCIHolder'

const oid4vciHasNoContactGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { contact } = _ctx
  return contact === undefined
}

const oid4vciHasContactGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { contact } = _ctx
  return contact !== undefined
}

const oid4vciSelectCredentialsGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { credentialSelection } = _ctx
  return credentialSelection.length > 1
}

const oid4vciRequirePinGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { requestData } = _ctx
  return requestData?.credentialOffer.userPinRequired === true
}

const oid4vciHasNoContactIdentityGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { contact, credentialsToAccept } = _ctx
  return !contact?.identities.some((identity: Identity): boolean => identity.identifier.correlationId === credentialsToAccept[0].correlationId)
}

const oid4vciVerificationCodeGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { verificationCode } = _ctx
  return verificationCode !== undefined && verificationCode.length > 0
}

const oid4vciCreateContactGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { contactAlias, hasContactConsent } = _ctx
  return hasContactConsent && contactAlias !== undefined && contactAlias.length > 0
}

const oid4vciHasSelectedCredentialsGuard = (_ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { selectedCredentials } = _ctx
  return selectedCredentials !== undefined && selectedCredentials.length > 0
}

// FIXME refactor this guard

const oid4vciNoAuthorizationGuard = (ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  return !oid4vciHasAuthorizationResponse(ctx, _event)
}
const oid4vciRequireAuthorizationGuard = (ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  const { openID4VCIClientState } = ctx

  if (!openID4VCIClientState) {
    throw Error('Missing openID4VCI client state in context')
  }

  if (
    !openID4VCIClientState.credentialOffer?.supportedFlows ??
    (openID4VCIClientState.endpointMetadata?.credentialIssuerMetadata?.authorization_endpoint ? [AuthzFlowType.AUTHORIZATION_CODE_FLOW] : [])
  ) {
    return false
  } else if (!openID4VCIClientState.authorizationURL) {
    return false
  }

  return !ctx.openID4VCIClientState?.authorizationCodeResponse
}

const oid4vciHasAuthorizationResponse = (ctx: OID4VCIMachineContext, _event: OID4VCIMachineEventTypes): boolean => {
  return !!ctx.openID4VCIClientState?.authorizationCodeResponse
}

const createOID4VCIMachine = (opts?: CreateOID4VCIMachineOpts): OID4VCIStateMachine => {
  const initialContext: OID4VCIMachineContext = {
    // TODO WAL-671 we need to store the data from OpenIdProvider here in the context and make sure we can restart the machine with it and init the OpenIdProvider
    requestData: opts?.requestData,
    locale: opts?.locale,
    credentialsSupported: {},
    credentialSelection: [],
    selectedCredentials: [],
    credentialsToAccept: [],
    hasContactConsent: true,
    contactAlias: '',
  }

  return createMachine<OID4VCIMachineContext, OID4VCIMachineEventTypes>({
    id: opts?.machineName ?? 'OID4VCIHolder',
    predictableActionArguments: true,
    initial: OID4VCIMachineStates.initiateOID4VCI,
    schema: {
      events: {} as OID4VCIMachineEventTypes,
      guards: {} as
        | { type: OID4VCIMachineGuards.hasNoContactGuard }
        | { type: OID4VCIMachineGuards.selectCredentialGuard }
        | { type: OID4VCIMachineGuards.requirePinGuard }
        | { type: OID4VCIMachineGuards.requireAuthorizationGuard }
        | { type: OID4VCIMachineGuards.noAuthorizationGuard }
        | { type: OID4VCIMachineGuards.hasNoContactIdentityGuard }
        | { type: OID4VCIMachineGuards.verificationCodeGuard }
        | { type: OID4VCIMachineGuards.hasContactGuard }
        | { type: OID4VCIMachineGuards.createContactGuard }
        | { type: OID4VCIMachineGuards.hasSelectedCredentialsGuard }
        | { type: OID4VCIMachineGuards.hasAuthorizationResponse },
      services: {} as {
        [OID4VCIMachineServices.initiateOID4VCI]: {
          data: InitiationData
        }
        [OID4VCIMachineServices.createCredentialSelection]: {
          data: Array<CredentialTypeSelection>
        }
        [OID4VCIMachineServices.getContact]: {
          data: Party | undefined
        }
        [OID4VCIMachineServices.addIssuerBranding]: {
          data: void
        }
        [OID4VCIMachineServices.getCredentials]: {
          data: Array<MappedCredentialToAccept> | undefined
        }
        [OID4VCIMachineServices.addContactIdentity]: {
          data: void
        }
        [OID4VCIMachineServices.assertValidCredentials]: {
          data: void
        }
        [OID4VCIMachineServices.storeCredentialBranding]: {
          data: void
        }
        [OID4VCIMachineServices.storeCredentials]: {
          data: void
        }
      },
    },
    context: initialContext,
    states: {
      [OID4VCIMachineStates.initiateOID4VCI]: {
        id: OID4VCIMachineStates.initiateOID4VCI,
        invoke: {
          src: OID4VCIMachineServices.initiateOID4VCI,
          onDone: {
            target: OID4VCIMachineStates.createCredentialSelection,
            actions: assign({
              authorizationCodeURL: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<InitiationData>) => _event.data.authorizationCodeURL,
              credentialBranding: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<InitiationData>) => _event.data.credentialBranding ?? {},
              credentialsSupported: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<InitiationData>) => _event.data.credentialsSupported,
              serverMetadata: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<InitiationData>) => _event.data.serverMetadata,
              openID4VCIClientState: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<InitiationData>) => _event.data.openID4VCIClientState,
            }),
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_initiation_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.createCredentialSelection]: {
        id: OID4VCIMachineStates.createCredentialSelection,
        invoke: {
          src: OID4VCIMachineServices.createCredentialSelection,
          onDone: {
            target: OID4VCIMachineStates.getContact,
            actions: assign({
              credentialSelection: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Array<CredentialTypeSelection>>) => _event.data,
            }),
            // TODO WAL-670 would be nice if we can have guard that checks if we have at least 1 item in the selection. not sure if this can occur but it would be more defensive.
            // Still cannot find a nice way to do this inside of an invoke besides adding another transition state
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_credential_selection_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.getContact]: {
        id: OID4VCIMachineStates.getContact,
        invoke: {
          src: OID4VCIMachineServices.getContact,
          onDone: {
            target: OID4VCIMachineStates.transitionFromSetup,
            actions: assign({ contact: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Party>) => _event.data }),
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_retrieve_contact_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.transitionFromSetup]: {
        id: OID4VCIMachineStates.transitionFromSetup,
        always: [
          {
            target: OID4VCIMachineStates.addContact,
            cond: OID4VCIMachineGuards.hasNoContactGuard,
          },
          {
            target: OID4VCIMachineStates.selectCredentials,
            cond: OID4VCIMachineGuards.selectCredentialGuard,
          },
          {
            target: OID4VCIMachineStates.initiateAuthorizationRequest,
            cond: OID4VCIMachineGuards.requireAuthorizationGuard,
          },
          {
            target: OID4VCIMachineStates.verifyPin,
            cond: OID4VCIMachineGuards.requirePinGuard,
          },
          {
            target: OID4VCIMachineStates.getCredentials,
          },
        ],
        on: {
          [OID4VCIMachineEvents.SET_AUTHORIZATION_CODE_URL]: {
            actions: assign({ authorizationCodeURL: (_ctx: OID4VCIMachineContext, _event: SetAuthorizationCodeURLEvent) => _event.data }),
          },
        },
      },
      [OID4VCIMachineStates.addContact]: {
        id: OID4VCIMachineStates.addContact,
        initial: OID4VCIMachineAddContactStates.idle,
        on: {
          [OID4VCIMachineEvents.SET_CONTACT_CONSENT]: {
            actions: assign({ hasContactConsent: (_ctx: OID4VCIMachineContext, _event: ContactConsentEvent) => _event.data }),
          },
          [OID4VCIMachineEvents.SET_CONTACT_ALIAS]: {
            actions: assign({ contactAlias: (_ctx: OID4VCIMachineContext, _event: ContactAliasEvent) => _event.data }),
          },
          [OID4VCIMachineEvents.CREATE_CONTACT]: {
            target: `.${OID4VCIMachineAddContactStates.next}`,
            actions: assign({ contact: (_ctx: OID4VCIMachineContext, _event: CreateContactEvent) => _event.data }),
            cond: OID4VCIMachineGuards.createContactGuard,
          },
          [OID4VCIMachineEvents.DECLINE]: {
            target: OID4VCIMachineStates.declined,
          },
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.aborted,
          },
        },
        states: {
          [OID4VCIMachineAddContactStates.idle]: {},
          [OID4VCIMachineAddContactStates.next]: {
            always: {
              target: `#${OID4VCIMachineStates.addIssuerBranding}`,
              cond: OID4VCIMachineGuards.hasContactGuard,
            },
          },
        },
      },
      [OID4VCIMachineStates.addIssuerBranding]: {
        id: OID4VCIMachineStates.addIssuerBranding,
        invoke: {
          src: OID4VCIMachineServices.addIssuerBranding,
          onDone: {
            target: OID4VCIMachineStates.transitionFromContactSetup,
          },
        },
      },
      [OID4VCIMachineStates.transitionFromContactSetup]: {
        id: OID4VCIMachineStates.transitionFromContactSetup,
        always: [
          {
            target: OID4VCIMachineStates.selectCredentials,
            cond: OID4VCIMachineGuards.selectCredentialGuard,
          },
          {
            target: OID4VCIMachineStates.initiateAuthorizationRequest,
            cond: OID4VCIMachineGuards.requireAuthorizationGuard,
          },
          {
            target: OID4VCIMachineStates.verifyPin,
            cond: OID4VCIMachineGuards.requirePinGuard,
          },
          {
            target: OID4VCIMachineStates.getCredentials,
          },
        ],
      },
      [OID4VCIMachineStates.selectCredentials]: {
        id: OID4VCIMachineStates.selectCredentials,
        on: {
          [OID4VCIMachineEvents.SET_SELECTED_CREDENTIALS]: {
            actions: assign({ selectedCredentials: (_ctx: OID4VCIMachineContext, _event: SelectCredentialsEvent) => _event.data }),
          },
          [OID4VCIMachineEvents.NEXT]: {
            target: OID4VCIMachineStates.transitionFromSelectingCredentials,
            cond: OID4VCIMachineGuards.hasSelectedCredentialsGuard,
          },
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.aborted,
          },
        },
      },
      [OID4VCIMachineStates.transitionFromSelectingCredentials]: {
        id: OID4VCIMachineStates.transitionFromSelectingCredentials,
        always: [
          {
            target: OID4VCIMachineStates.verifyPin,
            cond: OID4VCIMachineGuards.requirePinGuard,
          },
          {
            target: OID4VCIMachineStates.initiateAuthorizationRequest,
            cond: OID4VCIMachineGuards.requireAuthorizationGuard,
          },
          {
            target: OID4VCIMachineStates.getCredentials,
          },
        ],
      },
      [OID4VCIMachineStates.initiateAuthorizationRequest]: {
        id: OID4VCIMachineStates.initiateAuthorizationRequest,
        on: {
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.selectCredentials,
          },
          [OID4VCIMachineEvents.INVOKED_AUTHORIZATION_CODE_REQUEST]: {
            target: OID4VCIMachineStates.waitForAuthorizationResponse,
          },
        },
      },
      [OID4VCIMachineStates.waitForAuthorizationResponse]: {
        id: OID4VCIMachineStates.waitForAuthorizationResponse,
        on: {
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.initiateAuthorizationRequest,
          },
          [OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE]: {
            actions: assign({
              openID4VCIClientState: (_ctx: OID4VCIMachineContext, _event: AuthorizationResponseEvent) => {
                console.log(`=> Assigning authorizationCodeResponse using event data ${JSON.stringify(_event.data)}`)
                const authorizationCodeResponse = toAuthorizationResponsePayload(_event.data)
                console.log(`=> Assigned authorizationCodeResponse value ${JSON.stringify(authorizationCodeResponse)}`)
                return { ..._ctx.openID4VCIClientState!, authorizationCodeResponse }
              },
            }), // TODO can we not call toAuthorizationResponsePayload before
            // target: OID4VCIMachineStates.waitForAuthorizationResponse,
            // target: OID4VCIMachineStates.transitionFromSelectingCredentials,
          },
        },
        always: [
          {
            cond: OID4VCIMachineGuards.hasAuthorizationResponse,
            target: OID4VCIMachineStates.getCredentials,
          },
        ],
      },
      [OID4VCIMachineStates.verifyPin]: {
        id: OID4VCIMachineStates.verifyPin,
        initial: OID4VCIMachineVerifyPinStates.idle,
        on: {
          [OID4VCIMachineEvents.SET_VERIFICATION_CODE]: {
            target: `.${OID4VCIMachineVerifyPinStates.next}`,
            actions: assign({ verificationCode: (_ctx: OID4VCIMachineContext, _event: VerificationCodeEvent) => _event.data }),
          },
          [OID4VCIMachineEvents.PREVIOUS]: [
            {
              target: OID4VCIMachineStates.selectCredentials,
              cond: OID4VCIMachineGuards.selectCredentialGuard,
            },
            {
              target: OID4VCIMachineStates.aborted,
            },
          ],
        },
        states: {
          [OID4VCIMachineVerifyPinStates.idle]: {},
          [OID4VCIMachineVerifyPinStates.next]: {
            always: {
              target: `#${OID4VCIMachineStates.getCredentials}`,
              cond: OID4VCIMachineGuards.verificationCodeGuard,
            },
          },
        },
      },
      [OID4VCIMachineStates.getCredentials]: {
        id: OID4VCIMachineStates.getCredentials,
        invoke: {
          src: OID4VCIMachineServices.getCredentials,
          onDone: {
            target: OID4VCIMachineStates.verifyCredentials,
            actions: assign({
              credentialsToAccept: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Array<MappedCredentialToAccept>>) => _event.data,
            }),
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_retrieve_credentials_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
        exit: assign({ verificationCode: undefined }),
      },
      [OID4VCIMachineStates.verifyCredentials]: {
        id: OID4VCIMachineStates.verifyCredentials,
        invoke: {
          src: OID4VCIMachineServices.assertValidCredentials,
          onDone: {
            target: OID4VCIMachineStates.transitionFromWalletInput,
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_verify_credentials_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.transitionFromWalletInput]: {
        id: OID4VCIMachineStates.transitionFromWalletInput,
        always: [
          {
            target: OID4VCIMachineStates.addContactIdentity,
            cond: OID4VCIMachineGuards.hasNoContactIdentityGuard,
          },
          {
            target: OID4VCIMachineStates.reviewCredentials,
          },
        ],
      },
      [OID4VCIMachineStates.addContactIdentity]: {
        id: OID4VCIMachineStates.addContactIdentity,
        invoke: {
          src: OID4VCIMachineServices.addContactIdentity,
          onDone: {
            target: OID4VCIMachineStates.addIssuerBranding,
            actions: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Identity>): void => {
              _ctx.contact?.identities.push(_event.data)
            },
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_add_contact_identity_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.addIssuerBrandingAfterIdentity]: {
        id: OID4VCIMachineStates.addIssuerBrandingAfterIdentity,
        invoke: {
          src: OID4VCIMachineServices.addIssuerBranding,
          onDone: {
            target: OID4VCIMachineStates.reviewCredentials,
          },
        },
      },
      [OID4VCIMachineStates.reviewCredentials]: {
        id: OID4VCIMachineStates.reviewCredentials,
        on: {
          [OID4VCIMachineEvents.NEXT]: {
            target: OID4VCIMachineStates.storeCredentialBranding,
          },
          [OID4VCIMachineEvents.DECLINE]: {
            target: OID4VCIMachineStates.declined,
          },
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.aborted,
          },
        },
      },

      [OID4VCIMachineStates.storeCredentialBranding]: {
        id: OID4VCIMachineStates.storeCredentialBranding,
        invoke: {
          src: OID4VCIMachineServices.storeCredentialBranding,
          onDone: {
            target: OID4VCIMachineStates.storeCredentials,
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_store_credential_branding_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.storeCredentials]: {
        id: OID4VCIMachineStates.storeCredentials,
        invoke: {
          src: OID4VCIMachineServices.storeCredentials,
          onDone: {
            target: OID4VCIMachineStates.done,
          },
          onError: {
            target: OID4VCIMachineStates.handleError,
            actions: assign({
              error: (_ctx: OID4VCIMachineContext, _event: DoneInvokeEvent<Error>): ErrorDetails => ({
                title: translate('oid4vci_machine_store_credential_error_title'),
                message: _event.data.message,
              }),
            }),
          },
        },
      },
      [OID4VCIMachineStates.handleError]: {
        id: OID4VCIMachineStates.handleError,
        on: {
          [OID4VCIMachineEvents.NEXT]: {
            target: OID4VCIMachineStates.error,
          },
          [OID4VCIMachineEvents.PREVIOUS]: {
            target: OID4VCIMachineStates.error,
          },
        },
      },
      [OID4VCIMachineStates.aborted]: {
        id: OID4VCIMachineStates.aborted,
        type: 'final',
      },
      [OID4VCIMachineStates.declined]: {
        id: OID4VCIMachineStates.declined,
        type: 'final',
      },
      [OID4VCIMachineStates.error]: {
        id: OID4VCIMachineStates.error,
        type: 'final',
      },
      [OID4VCIMachineStates.done]: {
        id: OID4VCIMachineStates.done,
        type: 'final',
      },
    },
  })
}

export class OID4VCIMachine {
  static async newInstance(opts: OID4VCIMachineInstanceOpts, context: RequiredContext): Promise<{ interpreter: OID4VCIMachineInterpreter }> {
    const interpreter: OID4VCIMachineInterpreter = interpret(
      createOID4VCIMachine(opts).withConfig({
        services: {
          ...opts?.services,
        },
        guards: {
          oid4vciHasNoContactGuard,
          oid4vciSelectCredentialsGuard,
          oid4vciRequirePinGuard,
          oid4vciHasNoContactIdentityGuard,
          oid4vciVerificationCodeGuard,
          oid4vciHasContactGuard,
          oid4vciCreateContactGuard,
          oid4vciHasSelectedCredentialsGuard,
          oid4vciRequireAuthorizationGuard,
          oid4vciNoAuthorizationGuard,
          oid4vciHasAuthorizationResponse,
          ...opts?.guards,
        },
      }),
    )

    if (typeof opts?.subscription === 'function') {
      interpreter.onTransition(opts.subscription)
    }
    if (opts?.requireCustomNavigationHook !== true) {
      interpreter.onTransition((snapshot: OID4VCIMachineState): void => {
        opts?.stateNavigationListener(interpreter, snapshot)
      })
    }

    return { interpreter }
  }
}
