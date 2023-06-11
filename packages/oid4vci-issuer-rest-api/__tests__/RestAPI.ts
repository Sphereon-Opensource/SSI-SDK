import { TAgent } from '@veramo/core'
import { IOID4VCIRestAPIOpts, IPlugins, OID4VCIRestAPI } from '../src'
import agent from './agent'

export const opts: IOID4VCIRestAPIOpts = {
  serverOpts: {
    host: '0.0.0.0',
    port: 5000,
  },
}

OID4VCIRestAPI.init({
  context: { ...agent.context, agent: agent as TAgent<IPlugins> },
  opts,
  issuerInstanceArgs: { credentialIssuer: 'http://172.16.1.239:5000/test' },
}).then((restApi) => {
  console.log('REST API STARTED: ' + restApi.instance.metadataOptions.credentialIssuer)
})
