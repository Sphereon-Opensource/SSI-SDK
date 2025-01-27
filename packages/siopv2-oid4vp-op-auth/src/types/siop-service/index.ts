import {
  PresentationDefinitionWithLocation,
  PresentationSignCallback,
  RPRegistrationMetadataPayload, VerifiedAuthorizationRequest
} from '@sphereon/did-auth-siop'
import { IIdentifierResolution, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ICredentialStore, UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { DidAuthConfig, ICredentialLocaleBranding, Identity, Party } from '@sphereon/ssi-sdk.data-store'
import { IIssuanceBranding } from '@sphereon/ssi-sdk.issuance-branding'
import { IAgentContext, IDIDManager, IIdentifier, IResolver } from '@veramo/core'
import { IDidAuthSiopOpAuthenticator } from '../IDidAuthSiopOpAuthenticator'
import { Siopv2MachineContext, Siopv2MachineInterpreter, Siopv2MachineState } from '../machine'
import { DcqlQuery } from 'dcql'
import { Hasher } from '@sphereon/ssi-types'

export type DidAuthSiopOpAuthenticatorOptions = {
  presentationSignCallback?: PresentationSignCallback
  customApprovals?: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>
  onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
  hasher?: Hasher
}

export type GetMachineArgs = {
  url: string | URL
  idOpts?: ManagedIdentifierOptsOrResult
  stateNavigationListener?: (siopv2Machine: Siopv2MachineInterpreter, state: Siopv2MachineState, navigation?: any) => Promise<void>
}

export type CreateConfigArgs = { url: string }
export type CreateConfigResult = Omit<DidAuthConfig, 'stateId' | 'idOpts'>
export type GetSiopRequestArgs = { didAuthConfig?: Omit<DidAuthConfig, 'identifier'>, url: string }
// FIXME it would be nicer if these function are not tied to a certain machine so that we can start calling them for anywhere
export type RetrieveContactArgs = Pick<Siopv2MachineContext, 'url' | 'authorizationRequestData'>
// FIXME it would be nicer if these function are not tied to a certain machine so that we can start calling them for anywhere
export type AddIdentityArgs = Pick<Siopv2MachineContext, 'contact' | 'authorizationRequestData'>
export type SendResponseArgs = {
  didAuthConfig?: Omit<DidAuthConfig, 'identifier'>,
  authorizationRequestData?: Siopv2AuthorizationRequestData,
  selectedCredentials: Array<UniqueDigitalCredential>
  idOpts?: ManagedIdentifierOptsOrResult
  isFirstParty?: boolean
}
// FIXME it would be nicer if these function are not tied to a certain machine so that we can start calling them for anywhere
export type GetSelectableCredentialsArgs = Pick<Siopv2MachineContext, 'authorizationRequestData'>

export enum Siopv2HolderEvent {
  CONTACT_IDENTITY_CREATED = 'contact_identity_created',
  IDENTIFIER_CREATED = 'identifier_created',
}

export enum SupportedLanguage {
  ENGLISH = 'en',
  DUTCH = 'nl',
}

export type Siopv2AuthorizationResponseData = {
  body?: string | Record<string, any>
  url?: string
  queryParams?: Record<string, any>
}

export type Siopv2AuthorizationRequestData = {
  correlationId: string
  registrationMetadataPayload: RPRegistrationMetadataPayload
  issuer?: string
  name?: string
  uri?: URL
  clientId?: string
  presentationDefinitions?: PresentationDefinitionWithLocation[]
  dcqlQuery?: DcqlQuery
}

export type SelectableCredentialsMap = Map<string, Array<SelectableCredential>>

export type SelectableCredential = {
  credential: UniqueDigitalCredential
  credentialBranding: Array<ICredentialLocaleBranding>
  issuerParty?: Party
  subjectParty?: Party
}

export type OnContactIdentityCreatedArgs = {
  contactId: string
  identity: Identity
}

export type OnIdentifierCreatedArgs = {
  identifier: IIdentifier
}

export type RequiredContext = IAgentContext<
  IContactManager & IDidAuthSiopOpAuthenticator & IDIDManager & IResolver & IIdentifierResolution & ICredentialStore & IIssuanceBranding
>
