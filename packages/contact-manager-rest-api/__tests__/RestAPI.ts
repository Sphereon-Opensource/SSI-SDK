import { ExpressBuilder, StaticBearerAuth } from '../../ssi-express-support/src'
import { ContactManagerApiServer } from '../src'
import agent from './agent'

StaticBearerAuth.init('bearer')
  .withUsers([
    { id: 1, token: '123456', name: 'API User 1' },
    { id: 2, token: 'abcdef', name: 'API User 2' },
  ])
  .connectPassport()

const builder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
})
  .withMorganLogging({ format: 'dev' })
  .withPassportAuth(true)
  .withSessionOptions({ secret: '1234', name: 'oidc-session' })

const expressSupport = builder.build({ startListening: true })

new ContactManagerApiServer({
  opts: {
    endpointOpts: {
      globalAuth: {
        authentication: {
          enabled: false,
        },
      },
      partyRead: {
        disableGlobalAuth: true
      },
      partyWrite: {
        disableGlobalAuth: true
      },
      identityRead: {
        disableGlobalAuth: true
      },
      partyTypeRead: {
        disableGlobalAuth: true
      }
    },
    enableFeatures: ['party_read', 'party_write', 'party_type_read', 'identity_read'],
  },
  expressSupport,
  agent,
})
expressSupport.start()
