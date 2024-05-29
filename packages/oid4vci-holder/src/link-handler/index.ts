import { CredentialOfferClient } from '@sphereon/oid4vci-client'
import { convertURIToJsonObject } from '@sphereon/oid4vci-common'
import { DefaultLinkPriorities, LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import {
  GetMachineArgs,
  IOID4VCIHolder,
  OID4VCIHolderOptions,
  OID4VCIMachineEvents,
  OID4VCIMachineInterpreter,
  OID4VCIMachineState,
} from '../types/IOID4VCIHolder'

export class OID4VCIHolderLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>)
    | undefined
  private readonly noStateMachinePersistence: boolean
  private readonly options?: OID4VCIHolderOptions

  constructor(
    args: Pick<GetMachineArgs, 'stateNavigationListener' | 'options'> & {
      priority?: number | DefaultLinkPriorities
      protocols?: Array<string | RegExp>
      noStateMachinePersistence?: boolean
      context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>
    },
  ) {
    super({ ...args, id: 'OID4VCIHolder' })
    this.options = args.options
    this.context = args.context
    this.noStateMachinePersistence = args.noStateMachinePersistence === true
    this.stateNavigationListener = args.stateNavigationListener
  }

  async handle(url: string | URL): Promise<void> {
    const uri = new URL(url).toString()
    const offerData = convertURIToJsonObject(uri) as Record<string, unknown>
    const hasCode = 'code' in offerData && !!offerData.code && !('issuer' in offerData)
    const code = hasCode ? (offerData.code as string) : undefined
    console.log('offer contained code: ', code)

    const oid4vciMachine = await this.context.agent.oid4vciHolderGetMachineInterpreter({
      requestData: {
        ...(!hasCode && { credentialOffer: await CredentialOfferClient.fromURI(uri) }),
        ...(hasCode && { code: code }),
        uri,
      },
      options: this.options,
      stateNavigationListener: this.stateNavigationListener,
    })

    const interpreter = oid4vciMachine.interpreter
    //FIXME we need a better way to check if the state persistence plugin is available in the agent
    if (this.context.agent.availableMethods().includes('machineStatesFindActive')) {
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
      interpreter.start()
    }

    if (hasCode) {
      interpreter.send(OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE, { data: uri })
    }
  }
}
