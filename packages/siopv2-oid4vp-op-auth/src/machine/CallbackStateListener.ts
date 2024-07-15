import { Loggers, LogLevel, LogMethod } from '@sphereon/ssi-types'
import { Siopv2MachineInterpreter, Siopv2MachineState, Siopv2MachineStates } from '../types'

const logger = Loggers.DEFAULT.options('sphereon:siopv2-oid4vp:op-auth', {
  defaultLogLevel: LogLevel.DEBUG,
  methods: [LogMethod.CONSOLE],
}).get('sphereon:siopv2-oid4vp:op-auth')

export const OID4VPCallbackStateListener = (
  callbacks?: Map<Siopv2MachineStates, (machine: Siopv2MachineInterpreter, state: Siopv2MachineState, opts?: any) => Promise<void>>,
) => {
  return async (oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState): Promise<void> => {
    if (state._event.type === 'internal') {
      logger.debug('oid4vpCallbackStateListener: internal event')
      // Make sure we do not navigate when triggered by an internal event. We need to stay on current screen
      // Make sure we do not navigate when state has not changed
      return
    }
    logger.info(`VP state listener state: ${JSON.stringify(state.value)}`)

    if (!callbacks || callbacks.size === 0) {
      logger.info(`VP no callbacks registered for state: ${JSON.stringify(state.value)}`)
      return
    }

    for (const [stateKey, callback] of callbacks) {
      if (state.matches(stateKey)) {
        logger.log(`VP state callback for state: ${JSON.stringify(state.value)}, will execute...`)
        await callback(oid4vciMachine, state)
          .then(() => logger.log(`VP state callback executed for state: ${JSON.stringify(state.value)}`))
          .catch((error) => {
            logger.error(
              `VP state callback failed for state: ${JSON.stringify(state.value)}, error: ${JSON.stringify(error?.message)}, ${JSON.stringify(state.event)}`,
            )
            if (error.stack) {
              logger.error(error.stack)
            }
          })
        break
      }
    }
  }
}
