import { CredentialOfferClient } from '@sphereon/oid4vci-client'
import { convertURIToJsonObject } from '@sphereon/oid4vci-common'
import { DefaultLinkPriorities, LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IAgentContext } from '@veramo/core'
import { GetMachineArgs, IOID4VCIHolder, OID4VCIMachineEvents, OID4VCIMachineInterpreter, OID4VCIMachineState } from '../types/IOID4VCIHolder'

export class OID4VCIHolderLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IOID4VCIHolder>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, navigation?: any) => Promise<void>)
    | undefined

  constructor(
    args: Pick<GetMachineArgs, 'stateNavigationListener'> & {
      priority?: number | DefaultLinkPriorities
      protocols?: Array<string | RegExp>
      noStateMachinePersistence?: boolean
      context: IAgentContext<IOID4VCIHolder>
    },
  ) {
    super({ ...args, id: 'OID4VCIHolder' })
    this.context = args.context
    this.stateNavigationListener = args.stateNavigationListener
  }

  async handle(url: string | URL): Promise<void> {
    const uri = new URL(url).toString().replace(new RegExp('.*\\?'), 'openid-credential-offer://?')
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
      stateNavigationListener: this.stateNavigationListener,
    })

    const interpreter = oid4vciMachine.interpreter
    interpreter.start()

    if (hasCode) {
      interpreter.send(OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE, { data: uri })
    }
  }
}
