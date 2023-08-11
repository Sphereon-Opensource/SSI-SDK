import { ExpressBuilder, StaticBearerAuth } from '@sphereon/ssi-express-support'
import { ISIOPv2RPRestAPIOpts, SIOPv2RPApiServer } from '../src'
import agent from './agent'

const opts: ISIOPv2RPRestAPIOpts = {
  endpointOpts: {
    globalAuth: {
      authentication: {
        enabled: true,
        strategy: 'bearer',
      },
    },
    webappCreateAuthRequest: {
      webappBaseURI: 'http://192.168.2.18:5000',
      siopBaseURI: 'http://192.168.2.18:5000',
    },
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

new SIOPv2RPApiServer({ agent, expressSupport, opts })
expressSupport.start()
