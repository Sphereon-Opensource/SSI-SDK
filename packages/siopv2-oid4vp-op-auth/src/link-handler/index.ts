import { LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import { Loggers, LogMethod } from '@sphereon/ssi-types'
import { GetMachineArgs, IDidAuthSiopOpAuthenticator, LOGGER_NAMESPACE, Siopv2MachineInterpreter, Siopv2MachineState } from '../types'

const logger = Loggers.DEFAULT.options(LOGGER_NAMESPACE, { methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG] }).get(LOGGER_NAMESPACE)

export class Siopv2OID4VPLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>)
    | undefined
  private noStateMachinePersistence: boolean

  constructor(
    args: Pick<GetMachineArgs, 'stateNavigationListener'> & {
      protocols?: Array<string | RegExp>
      context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence>
      noStateMachinePersistence?: boolean
    },
  ) {
    super({ ...args, id: 'Siopv2' })
    this.context = args.context
    this.noStateMachinePersistence = args.noStateMachinePersistence === true
    this.stateNavigationListener = args.stateNavigationListener
  }

  async handle(url: string | URL): Promise<void> {
    logger.debug(`handling SIOP link: ${url}`)

    const siopv2Machine = await this.context.agent.siopGetMachineInterpreter({
      url,
      stateNavigationListener: this.stateNavigationListener,
    })
    siopv2Machine.interpreter.start()

    const init = await interpreterStartOrResume({
      stateType: 'new',
      interpreter: siopv2Machine.interpreter,
      context: this.context,
      cleanupAllOtherInstances: true,
      cleanupOnFinalState: true,
      singletonCheck: true,
      noRegistration: this.noStateMachinePersistence,
    })
    logger.debug(`SIOP machine started for link: ${url}`, init)
  }
}
