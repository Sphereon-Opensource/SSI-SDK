import { ExpressBuilder, StaticBearerAuth } from '../../ssi-express-support/src'
import { ContactManagerApiServer, IContactManagerAPIEndpointOpts } from '../src'
import agent from './agent'

const opts: IContactManagerAPIEndpointOpts = {
  endpointOpts: {
    globalAuth: {
      authentication: {
        enabled: true,
        strategy: 'bearer',
      },
    }
  },
}

StaticBearerAuth.init('bearer')
  .withUsers([
    { id: 1, token: '123456', name: 'API User 1' },
    { id: 2, token: 'abcdef', name: 'API User 2' },
  ])
  .connectPassport()
/*
passport.serializeUser(function (user: Express.User, done: (err: any, id?: any) => void) {
    done(null, user)
})

passport.deserializeUser(function (user: Express.User, done: (err: any, user?: Express.User | false | null) => void) {
    done(null, user)
})
*/

const builder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
})
  .withPassportAuth(true)
  .withMorganLogging()
// .withSessionOptions({secret: '1234', name: 'oidc-session'})

const expressSupport = builder.build({ startListening: true })

new ContactManagerApiServer({ agent, expressSupport, opts })
expressSupport.start()
