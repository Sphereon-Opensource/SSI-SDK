import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext, IDIDManager, IIdentifier, IResolver } from '@veramo/core'
import { PresentationDefinitionWithLocation, RPRegistrationMetadataPayload } from '@sphereon/did-auth-siop'
import { DidAuthConfig, Identity } from '@sphereon/ssi-sdk.data-store'
import { Siopv2MachineContext, Siopv2MachineInterpreter, Siopv2MachineState } from '../machine'
import { IDidAuthSiopOpAuthenticator } from '../IDidAuthSiopOpAuthenticator'

export type DidAuthSiopOpAuthenticatorOptions = {
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
}

export type GetMachineArgs = {
  url: string | URL
  stateNavigationListener?: (siopv2Machine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>
}

export type CreateConfigArgs = Pick<Siopv2MachineContext, 'url'>
export type CreateConfigResult = Omit<DidAuthConfig, 'stateId' | 'identifier'>
export type GetSiopRequestArgs = Pick<Siopv2MachineContext, 'didAuthConfig' | 'url'>
export type RetrieveContactArgs = Pick<Siopv2MachineContext, 'url' | 'authorizationRequestData'>
export type AddIdentityArgs = Pick<Siopv2MachineContext, 'contact' | 'authorizationRequestData'>
export type SendResponseArgs = Pick<Siopv2MachineContext, 'didAuthConfig' | 'authorizationRequestData' | 'selectedCredentials'>

export enum Siopv2HolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created', // TODO BEFORE PR: same events as the oid4vci holder module?
  IDENTIFIER_CREATED = 'identifier_created',
}

export enum SupportedLanguage {
  ENGLISH = 'en',
  DUTCH = 'nl',
}

export type Siopv2AuthorizationRequestData = {
  correlationId: string
  registrationMetadataPayload: RPRegistrationMetadataPayload
  issuer?: string
  name?: string
  uri?: URL
  clientId?: string
  presentationDefinitions?: PresentationDefinitionWithLocation[]
}

export type OnContactIdentityCreatedArgs = {
  contactId: string
  identity: Identity
}

export type OnIdentifierCreatedArgs = {
  identifier: IIdentifier
}

export type RequiredContext = IAgentContext<IContactManager | IDidAuthSiopOpAuthenticator | IDIDManager | IResolver>
