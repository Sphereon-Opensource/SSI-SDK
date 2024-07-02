import { IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { LinkHandlerAdapter } from '@sphereon/ssi-sdk.core'
import { IMachineStatePersistence, interpreterStartOrResume, SerializableState } from '@sphereon/ssi-sdk.xstate-machine-persistence'
import { IAgentContext } from '@veramo/core'
import { Loggers } from '@sphereon/ssi-types'
import { GetMachineArgs, IDidAuthSiopOpAuthenticator, LOGGER_NAMESPACE, Siopv2MachineInterpreter, Siopv2MachineState } from '../types'

const logger = Loggers.DEFAULT.options(LOGGER_NAMESPACE, {}).get(LOGGER_NAMESPACE)

export class Siopv2OID4VPLinkHandler extends LinkHandlerAdapter {
  private readonly context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence>
  private readonly stateNavigationListener:
    | ((oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>)
    | undefined
  private readonly noStateMachinePersistence: boolean
  private readonly idOpts?: IIdentifierOpts

  constructor(
    args: Pick<GetMachineArgs, 'stateNavigationListener'> & {
      protocols?: Array<string | RegExp>
      context: IAgentContext<IDidAuthSiopOpAuthenticator & IMachineStatePersistence>
      noStateMachinePersistence?: boolean
      idOpts?: IIdentifierOpts
    },
  ) {
    super({ ...args, id: 'Siopv2' })
    this.context = args.context
    this.noStateMachinePersistence = args.noStateMachinePersistence === true
    this.stateNavigationListener = args.stateNavigationListener
    this.idOpts = args.idOpts
  }

  async handle(
    url: string | URL,
    opts?: {
      machineState?: SerializableState
      idOpts?: IIdentifierOpts
    },
  ): Promise<void> {
    logger.debug(`handling SIOP link: ${url}`)

    const siopv2Machine = await this.context.agent.siopGetMachineInterpreter({
      url,
      idOpts: opts?.idOpts ?? this.idOpts,
      stateNavigationListener: this.stateNavigationListener,
    })

    const interpreter = siopv2Machine.interpreter
    //FIXME we need a better way to check if the state persistence plugin is available in the agent
    if (!this.noStateMachinePersistence && !opts?.machineState && this.context.agent.availableMethods().includes('machineStatesFindActive')) {
      const init = await interpreterStartOrResume({
        interpreter,
        context: this.context,
        cleanupAllOtherInstances: true,
        cleanupOnFinalState: true,
        singletonCheck: true,
        noRegistration: this.noStateMachinePersistence,
      })
      logger.debug(`SIOP machine started for link: ${url}`, init)
    } else {
      // @ts-ignore
      interpreter.start(opts?.machineState)
        logger.debug(`SIOP machine started for link: ${url}`)
    }

  }
}
