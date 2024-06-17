import { LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import { Loggers, LogMethod } from '@sphereon/ssi-types'
import { ISiopv2Holder } from '../types/ISiopv2Holder'
import { Siopv2MachineInterpreter, Siopv2MachineState } from '../types/machine'

const logger = Loggers.DEFAULT.options('sphereon:Siopv2:holder', { methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG] }).get('sphereon:Siopv2:holder')

export class Siopv2OID4VPLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<ISiopv2Holder & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>)
    | undefined

  constructor(args: { protocols?: Array<string | RegExp>; context: IAgentContext<ISiopv2Holder & IMachineStatePersistence> }) {
    super({ ...args, id: 'Siopv2' })
    this.context = args.context
  }

  async handle(url: string | URL): Promise<void> {
    logger.debug(`handling SIOP link: ${url}`)

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
    logger.debug(`SIOP machine started for link: ${url}`, init)
  }
}
