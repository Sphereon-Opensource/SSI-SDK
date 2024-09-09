import { CredentialOfferClient } from '@sphereon/oid4vci-client'
import { AuthorizationRequestOpts, AuthorizationServerClientOpts, AuthzFlowType, convertURIToJsonObject } from '@sphereon/oid4vci-common'
import { DefaultLinkPriorities, LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume, SerializableState } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import { GetMachineArgs, IOID4VCIHolder, OID4VCIMachineEvents, OID4VCIMachineInterpreter, OID4VCIMachineState } from '../types/IOID4VCIHolder'

/**
 * This handler only handles credential offer links (either by value or by reference)
 */
export class OID4VCIHolderLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>)
    | undefined
  private readonly noStateMachinePersistence: boolean
  private readonly authorizationRequestOpts?: AuthorizationRequestOpts
  private readonly clientOpts?: AuthorizationServerClientOpts

  constructor(
    args: Pick<GetMachineArgs, 'stateNavigationListener' | 'authorizationRequestOpts' | 'clientOpts'> & {
      priority?: number | DefaultLinkPriorities
      protocols?: Array<string | RegExp>
      noStateMachinePersistence?: boolean
      context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>
    },
  ) {
    super({ ...args, id: 'OID4VCIHolder' })
    this.authorizationRequestOpts = args.authorizationRequestOpts
    this.clientOpts = args.clientOpts
    this.context = args.context
    this.noStateMachinePersistence = args.noStateMachinePersistence === true
    this.stateNavigationListener = args.stateNavigationListener
  }

  async handle(
    url: string | URL,
    opts?: {
      machineState?: SerializableState
      authorizationRequestOpts?: AuthorizationRequestOpts
      createAuthorizationRequestURL?: boolean
      clientOpts?: AuthorizationServerClientOpts
      flowType?: AuthzFlowType
    },
  ): Promise<void> {
    const uri = new URL(url).toString()
    const offerData = convertURIToJsonObject(uri) as Record<string, unknown>
    const hasCode = 'code' in offerData && !!offerData.code && !('issuer' in offerData)
    const code = hasCode ? (offerData.code as string) : undefined
    const clientOpts = { ...this.clientOpts, ...opts?.clientOpts }
    const oid4vciMachine = await this.context.agent.oid4vciHolderGetMachineInterpreter({
      requestData: {
        // We know this can only be invoked with a credential offer, so we convert the URI to offer
        ...(!hasCode && { credentialOffer: await CredentialOfferClient.fromURI(uri) }),
        ...(hasCode && { code: code }),
        createAuthorizationRequestURL: opts?.createAuthorizationRequestURL,
        flowType: opts?.flowType,
        uri,
      },
      authorizationRequestOpts: { ...this.authorizationRequestOpts, ...opts?.authorizationRequestOpts },
      ...((clientOpts.clientId || clientOpts.clientAssertionType) && { clientOpts: clientOpts as AuthorizationServerClientOpts }),
      stateNavigationListener: this.stateNavigationListener,
    })

    const interpreter = oid4vciMachine.interpreter
    //FIXME we need a better way to check if the state persistence plugin is available in the agent
    if (!opts?.machineState && this.context.agent.availableMethods().includes('machineStatesFindActive')) {
      const stateType = hasCode ? 'existing' : 'new'
      await interpreterStartOrResume({
        stateType,
        interpreter,
        context: this.context,
        cleanupAllOtherInstances: true,
        cleanupOnFinalState: true,
        singletonCheck: true,
        noRegistration: this.noStateMachinePersistence,
      })
    } else {
      // @ts-ignore
      interpreter.start(opts?.machineState)
    }

    if (hasCode) {
      interpreter.send(OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE, { data: uri })
    }
  }
}
