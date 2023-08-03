import { ExpressBuilder } from '@sphereon/ssi-sdk.express-support'
import agent from './agent'
import { ISIOPv2RPRestAPIOpts, SIOPv2RPApiServer } from '../src'
import morgan from 'morgan'

const opts: ISIOPv2RPRestAPIOpts = {
  webappCreateAuthRequest: {
    webappBaseURI: 'http://192.168.2.18:5000',
    siopBaseURI: 'http://192.168.2.18:5000',
  },
}
const builder = ExpressBuilder.fromServerOpts({
  port: 5000,
  hostname: '0.0.0.0',
}).withPassportAuth(false)
// .withSessionOptions({secret: '1234', name: 'oidc-session'})
// .addHandler(morgan('dev'))
const expressArgs = builder.build({ startListening: true })
expressArgs.express.use(morgan('dev'))

new SIOPv2RPApiServer({ agent, expressArgs, opts })
