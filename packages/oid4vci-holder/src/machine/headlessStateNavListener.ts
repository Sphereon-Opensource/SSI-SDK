import { Loggers, LogLevel, LogMethod } from '@sphereon/ssi-types'
import { OID4VCIMachineInterpreter, OID4VCIMachineState, OID4VCIMachineStates } from '../types/IOID4VCIHolder'

const logger = Loggers.DEFAULT.options('sphereon:oid4vci:holder', { defaultLogLevel: LogLevel.DEBUG, methods: [LogMethod.CONSOLE] }).get(
  'sphereon:oid4vci:holder',
)

export const OID4VCICallbackStateListener = (
  callbacks?: Map<OID4VCIMachineStates, (machine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, opts?: any) => Promise<void>>,
) => {
  return async (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState): Promise<void> => {
    if (state._event.type === 'internal') {
      logger.debug('oid4vciCallbackStateListener: internal event')
      // Make sure we do not navigate when triggered by an internal event. We need to stay on current screen
      // Make sure we do not navigate when state has not changed
      return
    }
    logger.info(`VCI state listener state: ${JSON.stringify(state.value)}`)

    if (!callbacks || callbacks.size === 0) {
      logger.info(`VCI no callbacks registered for state: ${JSON.stringify(state.value)}`)
      return
    }

    for (const [stateKey, callback] of callbacks) {
      if (state.matches(stateKey)) {
        logger.log(`VCI state callback for state: ${JSON.stringify(state.value)}, will execute...`)
        await callback(oid4vciMachine, state)
          .then(() => logger.log(`state callback executed for state: ${JSON.stringify(state.value)}`))
          .catch((error) => {
            logger.error(
              `VCI state callback failed for state: ${JSON.stringify(state.value)}, error: ${JSON.stringify(error?.message)}, ${JSON.stringify(state.event)}`,
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
