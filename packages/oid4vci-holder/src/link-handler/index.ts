import { CredentialOfferClient } from '@sphereon/oid4vci-client'
import {
  AuthorizationRequestOpts,
  AuthorizationServerClientOpts,
  AuthzFlowType,
  convertURIToJsonObject,
  decodeJsonProperties,
} from '@sphereon/oid4vci-common'
import { DefaultLinkPriorities, LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume, SerializableState } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import { GetMachineArgs, IOID4VCIHolder, OID4VCIMachineEvents, OID4VCIMachineStateNavigationListener } from '../types/IOID4VCIHolder'
import { FirstPartyMachineStateNavigationListener } from '../types/FirstPartyMachine'
import { fetch } from 'cross-fetch'

/**
 * This handler only handles credential offer links (either by value or by reference)
 */
export class OID4VCIHolderLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IOID4VCIHolder & IMachineStatePersistence>
  private readonly stateNavigationListener?: OID4VCIMachineStateNavigationListener
  private readonly firstPartyStateNavigationListener?: FirstPartyMachineStateNavigationListener
  private readonly noStateMachinePersistence: boolean
  private readonly authorizationRequestOpts?: AuthorizationRequestOpts
  private readonly clientOpts?: AuthorizationServerClientOpts
  private readonly trustAnchors?: Array<string>

  constructor(
    args: Pick<
      GetMachineArgs,
      'stateNavigationListener' | 'authorizationRequestOpts' | 'clientOpts' | 'trustAnchors' | 'firstPartyStateNavigationListener'
    > & {
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
    this.firstPartyStateNavigationListener = args.firstPartyStateNavigationListener
    this.trustAnchors = args.trustAnchors
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
    let offerData = convertURIToJsonObject(uri) as Record<string, unknown>
    if ('credential_offer_uri' in offerData) {
      const credentialOfferUri = offerData['credential_offer_uri'] as string
      const response = await fetch(decodeURIComponent(credentialOfferUri))
      if (!(response && response.status >= 200 && response.status < 400)) {
        return Promise.reject(
          `the credential offer URI endpoint call was not successful. http code ${response.status} - reason ${response.statusText}`,
        )
      }

      if (response.headers.get('Content-Type')?.startsWith('application/json') === false) {
        return Promise.reject('the credential offer URI endpoint did not return content type application/json')
      }
      offerData = decodeJsonProperties(await response.json()) as Record<string, unknown>
    }
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
      trustAnchors: this.trustAnchors,
      authorizationRequestOpts: { ...this.authorizationRequestOpts, ...opts?.authorizationRequestOpts },
      ...((clientOpts.clientId || clientOpts.clientAssertionType) && { clientOpts: clientOpts as AuthorizationServerClientOpts }),
      stateNavigationListener: this.stateNavigationListener,
      firstPartyStateNavigationListener: this.firstPartyStateNavigationListener,
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
