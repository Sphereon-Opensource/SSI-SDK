import {Loggers, LogLevel, LogMethod} from '@sphereon/ssi-types'
import {OID4VCIMachineInterpreter, OID4VCIMachineState, OID4VCIMachineStates} from '../types/IOID4VCIHolder'

const logger = Loggers.DEFAULT.options('sphereon:oid4vci:holder', {defaultLogLevel: LogLevel.DEBUG, methods: [LogMethod.CONSOLE]}).get('sphereon:oid4vci:holder')

export const OID4VCIStateListenerWithCallbacks = (
    callbacks?: Map<OID4VCIMachineStates, (machine: OID4VCIMachineInterpreter, state: OID4VCIMachineState, opts?: any) => Promise<void> >) => {
    const callback = async (oid4vciMachine: OID4VCIMachineInterpreter,
                  state: OID4VCIMachineState): Promise<void> => {
        if (state._event.type === 'internal') {
            logger.debug('oid4vciStateNavigationListener: internal event');
            // Make sure we do not navigate when triggered by an internal event. We need to stay on current screen
            // Make sure we do not navigate when state has not changed
            return;
        }
        logger.info(`state listener for state: ${JSON.stringify(state.value)}`)

        if (!callbacks || callbacks.size === 0) {
            logger.debug(`no callbacks registered for state: ${JSON.stringify(state.value)}`)
            return
        }

        callbacks.forEach((callback, key: OID4VCIMachineStates) => {
            if (state.matches(key)) {
                logger.log(`state callback found for state: ${JSON.stringify(state.value)}, will execute callback`)
                callback(oid4vciMachine, state)
                    .then(() => logger.log(`state callback executed for state: ${JSON.stringify(state.value)}`))
                    .catch((error) => logger.log(`state callback failed for state: ${JSON.stringify(state.value)}, error: ${JSON.stringify(error?.message)}, ${state.event}`))
            }
        })
    }
    return callback
}
