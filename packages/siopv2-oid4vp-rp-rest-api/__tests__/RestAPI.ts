import agent from './agent'
import { ISIOPv2RPRestAPIOpts, SIOPv2RPRestAPI } from '../src'

const opts: ISIOPv2RPRestAPIOpts = {
  hostname: '0.0.0.0',
  port: 5000,
  webappBaseURI: 'http://172.16.255.33:5000',
  siopBaseURI: 'http://172.16.255.33:5000',
}

new SIOPv2RPRestAPI({ agent, opts })
