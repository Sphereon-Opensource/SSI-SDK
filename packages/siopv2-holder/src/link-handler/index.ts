import { LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import Debug from 'debug'
import { IDidAuthSiopOpAuthenticator } from '../types/IDidAuthSiopOpAuthenticator'
import { Siopv2MachineInterpreter, Siopv2MachineState } from '../types'

const debug = Debug(`sphereon:ssi-sdk:linkhandler:siop`)
export class Siopv2OID4VPLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>)
    | undefined

  constructor(args: { protocols?: Array<string | RegExp>; context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence> }) {
    super({ ...args, id: 'Siopv2' })
    this.context = args.context
  }

  async handle(url: string | URL): Promise<void> {
    debug(`handling SIOP link: ${url}`)

    const interpreter = await this.context.agent.siopGetMachineInterpreter({
      opts: {
        url,
        stateNavigationListener: this.stateNavigationListener,
      },
    })
    interpreter.start()

    const init = await interpreterStartOrResume({
      stateType: 'new',
      interpreter,
      context: this.context,
      cleanupAllOtherInstances: true,
      cleanupOnFinalState: true,
      singletonCheck: true,
    })
    debug(`SIOP machine started for link: ${url}`, init)
  }
}
