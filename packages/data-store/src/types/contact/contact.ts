import { IIdentifier } from '@veramo/core'

export enum IdentityRoleEnum {
  ISSUER = 'issuer',
  VERIFIER = 'verifier',
  HOLDER = 'holder',
}

export enum ConnectionTypeEnum {
  OPENID_CONNECT = 'OIDC',
  SIOPv2 = 'SIOPv2',
  SIOPv2_OpenID4VP = 'SIOPv2+OpenID4VP',
}

export enum CorrelationIdentifierEnum {
  DID = 'did',
  URL = 'url',
}

export interface IContact {
  id: string
  uri?: string
  roles: Array<IdentityRoleEnum>
  identities: Array<IIdentity>
  contactOwner: ContactOwner
  contactType: IContactType
  relationships: Array<IContactRelationship>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicContact {
  uri?: string
  identities?: Array<IBasicIdentity>
  contactOwner: BasicContactOwner
  contactType: BasicContactType
  relationships?: Array<BasicContactRelationship>
}
export interface IPartialContact extends Partial<Omit<IContact, 'identities' | 'contactOwner' | 'contactType' | 'relationships'>> {
  identities?: IPartialIdentity
  contactOwner?: PartialContactOwner
  contactType?: IPartialContactType
  relationships?: IPartialContactRelationship
}

export interface IIdentity {
  id: string
  alias: string
  roles: Array<IdentityRoleEnum>
  identifier: ICorrelationIdentifier
  connection?: IConnection
  metadata?: Array<IMetadataItem>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicIdentity {
  alias: string
  roles: Array<IdentityRoleEnum>
  identifier: BasicCorrelationIdentifier
  connection?: IBasicConnection
  metadata?: Array<BasicMetadataItem>
}
export interface IPartialIdentity extends Partial<Omit<IIdentity, 'identifier' | 'connection' | 'metadata' | 'roles'>> {
  identifier?: IPartialCorrelationIdentifier
  connection?: IPartialConnection
  metadata?: IPartialMetadataItem
  roles?: IdentityRoleEnum //FindOperator
  contactId?: string
}

export interface IMetadataItem {
  id: string
  label: string
  value: string
}
export declare type BasicMetadataItem = Omit<IMetadataItem, 'id'>
export interface IPartialMetadataItem extends Partial<IMetadataItem> {}

export interface ICorrelationIdentifier {
  id: string
  type: CorrelationIdentifierEnum
  correlationId: string
}
export declare type BasicCorrelationIdentifier = Omit<ICorrelationIdentifier, 'id'>
export interface IPartialCorrelationIdentifier extends Partial<ICorrelationIdentifier> {}

export interface IConnection {
  id: string
  type: ConnectionTypeEnum
  config: ConnectionConfig
}
export interface IBasicConnection {
  type: ConnectionTypeEnum
  config: BasicConnectionConfig
}
export interface IPartialConnection extends Partial<Omit<IConnection, 'config'>> {
  config: PartialConnectionConfig
}

export interface IOpenIdConfig {
  id: string
  clientId: string
  clientSecret: string
  scopes: Array<string>
  issuer: string
  redirectUrl: string
  dangerouslyAllowInsecureHttpRequests: boolean
  clientAuthMethod: 'basic' | 'post' | undefined
}
export declare type BasicOpenIdConfig = Omit<IOpenIdConfig, 'id'>
export interface IPartialOpenIdConfig extends Partial<IOpenIdConfig> {}

export interface IDidAuthConfig {
  id: string
  identifier: IIdentifier
  stateId: string
  redirectUrl: string
  sessionId: string
}
export declare type BasicDidAuthConfig = Omit<IDidAuthConfig, 'id'>
export interface IPartialDidAuthConfig extends Partial<Omit<IDidAuthConfig, 'identifier'>> {
  identifier: Partial<IIdentifier> // TODO
}

export declare type ConnectionConfig = IOpenIdConfig | IDidAuthConfig
export declare type BasicConnectionConfig = BasicDidAuthConfig | BasicOpenIdConfig
export declare type PartialConnectionConfig = IPartialOpenIdConfig | IPartialDidAuthConfig

export enum ContactTypeEnum {
  PERSON = 'person',
  ORGANIZATION = 'organization',
}

export interface IPerson {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  displayName: string
  createdAt: Date
  lastUpdatedAt: Date
}
export declare type BasicPerson = Omit<IPerson, 'id' | 'createdAt' | 'lastUpdatedAt'>
export interface IPartialPerson extends Partial<IPerson> {}

export interface IOrganization {
  id: string
  legalName: string
  displayName: string
  cocNumber?: string
  createdAt: Date
  lastUpdatedAt: Date
}
export declare type BasicOrganization = Omit<IOrganization, 'id' | 'createdAt' | 'lastUpdatedAt'>
export interface IPartialOrganization extends Partial<IOrganization> {}

export declare type ContactOwner = IPerson | IOrganization
export declare type BasicContactOwner = BasicPerson | BasicOrganization
export declare type PartialContactOwner = IPartialPerson | IPartialOrganization

export interface IContactType {
  id: string
  type: ContactTypeEnum
  name: string
  tenantId: string
  description?: string
  createdAt: Date
  lastUpdatedAt: Date
}
export declare type BasicContactType = Omit<IContactType, 'id' | 'createdAt' | 'lastUpdatedAt'>
export interface IPartialContactType extends Partial<IContactType> {}

export interface IContactRelationship {
  id: string
  leftContactId: string
  rightContactId: string
  createdAt: Date
  lastUpdatedAt: Date
}
export declare type BasicContactRelationship = Omit<IContactRelationship, 'id' | 'createdAt' | 'lastUpdatedAt'>
export interface IPartialContactRelationship extends Partial<Omit<IContactRelationship, 'leftContactId' | 'rightContactId'>> {
  left: IPartialContact
  right: IPartialContact
}
