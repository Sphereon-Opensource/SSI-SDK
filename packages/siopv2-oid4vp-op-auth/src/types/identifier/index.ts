import { IDIDManager, IIdentifier, IResolver, TAgent, TKeyType } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { RequiredContext } from '../siop-service'
import { SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'

export const DID_PREFIX = 'did'

export type CreateOrGetIdentifierOpts = {
  method: SupportedDidMethodEnum
  createOpts?: CreateIdentifierCreateOpts
}

export type CreateIdentifierCreateOpts = {
  kms?: string
  alias?: string
  options?: IdentifierProviderOpts
}

export type IdentifierProviderOpts = {
  type?: TKeyType
  use?: string
  [x: string]: any
}

export type KeyOpts = {
  didMethod: SupportedDidMethodEnum
  keyType: TKeyType
  codecName?: string
  kid?: string
  identifier: IIdentifier
}

export type GetIdentifierArgs = {
  keyOpts: KeyOpts // TODO was IssuanceOpts, check if ok like this
  context: RequiredContext
}

export type IdentifierWithKey = {
  identifier: IIdentifier
  key: _ExtendedIKey
  kid: string
}

export type GetAuthenticationKeyArgs = {
  identifier: IIdentifier
  context: RequiredContext
}

export type CreateIdentifierArgs = {
  context: RequiredContext
  opts?: CreateIdentifierOpts
}

export type CreateIdentifierOpts = {
  method: SupportedDidMethodEnum
  createOpts?: CreateIdentifierCreateOpts
}

export type DidAgents = TAgent<IResolver & IDIDManager>
