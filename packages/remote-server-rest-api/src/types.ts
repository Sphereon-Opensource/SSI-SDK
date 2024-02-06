import { TAgent } from '@veramo/core'
import { ExpressSupport, GenericAuthArgs } from '@sphereon/ssi-express-support'

export type RemoteServerApiEndpointOpts = {
  basePath?: string
  globalAuth?: GenericAuthArgs
}

export type RemoteServerApiOpts = {
  exposedMethods: Array<string>
  endpointOpts?: RemoteServerApiEndpointOpts
}

export type RemoteServerApiServerArgs = {
  agent: TAgent<any>
  expressSupport: ExpressSupport
  opts: RemoteServerApiOpts
}
