import { ExpressBuilder } from '../../ssi-express-support/src'
import { ContactManagerApiServer } from '../src'
import agent from './agent'

const builder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
})
  .withMorganLogging({ format: 'dev' })
  .withPassportAuth(false)

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
