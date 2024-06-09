import { ExpressCorsConfigurer } from '../../ssi-express-support/src'
import { ExpressBuilder } from '../../ssi-express-support/src'
import agent from './agent'
import { PdManagerApiServer } from '../src'

const builder = ExpressBuilder.fromServerOpts({
  port: 5010,
  hostname: '0.0.0.0',
})
  .withMorganLogging({ format: 'dev' })
  .withPassportAuth(false)
  .withCorsConfigurer(new ExpressCorsConfigurer().allowOrigin('*'))

const expressSupport = builder.build({ startListening: true })

new PdManagerApiServer({
  opts: {
    endpointOpts: {
      globalAuth: {
        authentication: {
          enabled: false,
        },
      },
    },
    enableFeatures: ['pd_read', 'pd_write', 'pd_delete'],
  },
  expressSupport,
  agent,
})
expressSupport.start()
