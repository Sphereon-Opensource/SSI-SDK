import { ExpressCorsConfigurer } from '../../ssi-express-support/src'
import { ExpressBuilder } from '../../ssi-express-support/src'
import { ContactManagerApiServer } from '../src'
import agent from './agent'

const builder = ExpressBuilder.fromServerOpts({
  port: 5010,
  hostname: '0.0.0.0',
})
  .withMorganLogging({ format: 'dev' })
  .withPassportAuth(false)
  .withCorsConfigurer(new ExpressCorsConfigurer().allowOrigin('*'))

const expressSupport = builder.build({ startListening: true })

new ContactManagerApiServer({
  opts: {
    endpointOpts: {
      globalAuth: {
        authentication: {
          enabled: false,
        },
      },
    },
    enableFeatures: ['party_read', 'party_write', 'party_type_read', 'identity_read'],
  },
  expressSupport,
  agent,
})
expressSupport.start()
