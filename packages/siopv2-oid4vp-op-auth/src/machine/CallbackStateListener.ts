import { Loggers, LogLevel, LogMethod } from '@sphereon/ssi-types'
import { Siopv2MachineInterpreter, Siopv2MachineState, Siopv2MachineStates } from '../types'

const logger = Loggers.DEFAULT.options('sphereon:oid4vp:holder', {
  defaultLogLevel: LogLevel.DEBUG,
  methods: [LogMethod.CONSOLE],
}).get('sphereon:oid4vp:holder')

export const OID4VPCallbackStateListener = (
  callbacks?: Map<Siopv2MachineStates, (machine: Siopv2MachineInterpreter, state: Siopv2MachineState, opts?: any) => Promise<void>>,
  // TODO implement Map<Siopv2MachineStates | Set<Siopv2MachineStates>> ?
) => {
  return async (oid4vciMachine: Siopv2MachineInterpreter, state: Siopv2MachineState): Promise<void> => {
    if (state._event.type === 'internal') {
      logger.debug('oid4vpCallbackStateListener: internal event')
      // Make sure we do not navigate when triggered by an internal event. We need to stay on current screen
      // Make sure we do not navigate when state has not changed
      return
    }
    logger.info(`state listener for state: ${JSON.stringify(state.value)}`)

    if (!callbacks || callbacks.size === 0) {
      logger.debug(`no callbacks registered for state: ${JSON.stringify(state.value)}`)
      return
    }

    const callbackPromises: Promise<void>[] = []

    callbacks.forEach((callback, key: Siopv2MachineStates) => {
      if (state.matches(key)) {
        logger.log(`state callback found for state: ${JSON.stringify(state.value)}, will execute callback`)
        const callbackPromise = callback(oid4vciMachine, state)
          .then(() => logger.log(`state callback executed for state: ${JSON.stringify(state.value)}`))
          .catch((error) =>
            logger.log(`state callback failed for state: ${JSON.stringify(state.value)}, error: ${JSON.stringify(error?.message)}, ${state.event}`),
          )
        callbackPromises.push(callbackPromise)
      }
    })

    await Promise.all(callbackPromises)
  }
}
