import agent from './agent.mjs'
import { ISIOPv2RPRestAPIOpts, SIOPv2RPRestAPI } from '../src/index.mjs'

const opts: ISIOPv2RPRestAPIOpts = {
  hostname: '0.0.0.0',
  port: 5000,
  webappBaseURI: 'http://192.168.2.18:5000',
  siopBaseURI: 'http://192.168.2.18:5000',
}

new SIOPv2RPRestAPI({ agent, opts })
