import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { IAgentContext, IDIDManager, IIdentifier, IPluginMethodMap, IResolver, VerifiableCredential } from '@veramo/core'
import { PresentationDefinitionWithLocation, RPRegistrationMetadataPayload } from '@sphereon/did-auth-siop'
import { DidAuthConfig, Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { IDidAuthSiopOpAuthenticator } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { Siopv2Machine as Siopv2MachineId, Siopv2MachineContext, Siopv2MachineInterpreter, Siopv2MachineState } from './machine'

export interface ISiopv2Holder extends IPluginMethodMap {
  siopv2HolderGetMachineInterpreter(args: GetMachineArgs, context: RequiredContext): Promise<Siopv2MachineId>

  siopv2HolderCreateConfig(args: CreateConfigArgs): Promise<CreateConfigResult>

  siopv2HolderGetSiopRequest(args: GetSiopRequestArgs, context: RequiredContext): Promise<Siopv2AuthorizationRequestData>

  siopv2HolderRetrieveContact(args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined>

  siopv2HolderAddIdentity(args: AddIdentityArgs, context: RequiredContext): Promise<void>

  siopv2HolderSendResponse(args: SendResponseArgs, context: RequiredContext): Promise<Response>
}

export type Siopv2HolderOptions = {
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
}

export type GetMachineArgs = {
  url: string | URL
  stateNavigationListener?: (Siopv2Machine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>
}

export type CreateConfigArgs = Pick<Siopv2MachineContext, 'url'>
export type CreateConfigResult = Omit<DidAuthConfig, 'stateId' | 'identifier'>
export type GetSiopRequestArgs = Pick<Siopv2MachineContext, 'didAuthConfig' | 'url'>
export type RetrieveContactArgs = Pick<Siopv2MachineContext, 'url' | 'authorizationRequestData'>
export type AddIdentityArgs = Pick<Siopv2MachineContext, 'contact' | 'authorizationRequestData'>
export type SendResponseArgs = Pick<Siopv2MachineContext, 'didAuthConfig' | 'authorizationRequestData' | 'selectedCredentials'>

export enum Siopv2HolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created', // TODO BEFORE PR: same events as the oid4vci holder module?
  CREDENTIAL_STORED = 'credential_stored',
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

export type OnCredentialStoredArgs = {
  vcHash: string
  credential: VerifiableCredential
}

export type OnIdentifierCreatedArgs = {
  identifier: IIdentifier
}

export type RequiredContext = IAgentContext<IContactManager | IDidAuthSiopOpAuthenticator | IDIDManager | IResolver>
