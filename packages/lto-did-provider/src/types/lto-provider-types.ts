import { LtoVerificationMethod, Network } from '@sphereon/lto-did-ts'
import { IAgentContext, IKeyManager } from '@veramo/core'

export interface ILtoDidProviderOpts {
  connectionMode: IDidConnectionMode
  defaultKms: string
  network?: Network | string
  rpcUrl?: string
  uniResolverUrl?: string
  sponsorPrivateKeyBase58?: string
  registrarUrl?: string
}

export interface ICreateIdentifierOpts {
  verificationMethods?: LtoVerificationMethod[] | undefined
  privateKeyHex?: string
}

export interface IAddKeyOpts {
  verificationMethod: LtoVerificationMethod
}

export type IRequiredContext = IAgentContext<IKeyManager>

export enum IDidConnectionMode {
  UNI = 'UNI',
  NODE = 'NODE',
}
