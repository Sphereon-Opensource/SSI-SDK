import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  BasicContactOwner,
  BasicContactType,
  FindContactArgs,
  FindIdentityArgs,
  IBasicIdentity,
  IContact,
  IContactRelationship,
  IIdentity,
  FindRelationshipArgs,
  ContactTypeEnum,
  FindContactTypeArgs,
  IContactType,
} from '@sphereon/ssi-sdk.data-store'

export interface IContactManager extends IPluginMethodMap {
  cmGetContact(args: IGetContactArgs, context: IRequiredContext): Promise<IContact>
  cmGetContacts(args?: IGetContactsArgs): Promise<Array<IContact>>
  cmAddContact(args: IAddContactArgs, context: IRequiredContext): Promise<IContact>
  cmUpdateContact(args: IUpdateContactArgs, context: IRequiredContext): Promise<IContact>
  cmRemoveContact(args: IRemoveContactArgs, context: IRequiredContext): Promise<boolean>
  cmGetIdentity(args: IGetIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmGetIdentities(args?: IGetIdentitiesArgs): Promise<Array<IIdentity>>
  cmAddIdentity(args: IAddIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmUpdateIdentity(args: IUpdateIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmRemoveIdentity(args: IRemoveIdentityArgs, context: IRequiredContext): Promise<boolean>
  cmGetRelationship(args: IGetRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship>
  cmGetRelationships(args?: IGetRelationshipsArgs): Promise<Array<IContactRelationship>>
  cmUpdateRelationship(args: IUpdateRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship>
  cmAddRelationship(args: IAddRelationshipArgs, context: IRequiredContext): Promise<IContactRelationship>
  cmRemoveRelationship(args: IRemoveRelationshipArgs, context: IRequiredContext): Promise<boolean>
  cmGetContactType(args: IGetContactTypeArgs, context: IRequiredContext): Promise<IContactType>
  cmGetContactTypes(args?: IGetContactTypesArgs): Promise<Array<IContactType>>
  cmAddContactType(args: IAddContactTypeArgs, context: IRequiredContext): Promise<IContactType>
  cmUpdateContactType(args: IUpdateContactTypeArgs, context: IRequiredContext): Promise<IContactType>
  cmRemoveContactType(args: IRemoveContactTypeArgs, context: IRequiredContext): Promise<boolean>
}

export interface IGetContactArgs {
  contactId: string
}

export interface IGetContactsArgs {
  filter?: FindContactArgs
}

export interface IAddContactArgs {
  uri?: string
  contactType: BasicContactType
  contactOwner: BasicContactOwner
  identities?: Array<IBasicIdentity>
}

export interface IUpdateContactArgs {
  contact: IContact
}

export interface IRemoveContactArgs {
  contactId: string
}

export interface IGetIdentityArgs {
  identityId: string
}

export interface IGetIdentitiesArgs {
  filter?: FindIdentityArgs
}

export interface IAddIdentityArgs {
  contactId: string
  identity: IBasicIdentity
}

export interface IUpdateIdentityArgs {
  identity: IIdentity
}

export interface IRemoveIdentityArgs {
  identityId: string
}

export interface IAddRelationshipArgs {
  leftId: string
  rightId: string
}

export interface IRemoveRelationshipArgs {
  relationshipId: string
}

export interface IGetRelationshipArgs {
  relationshipId: string
}

export interface IGetRelationshipsArgs {
  filter: FindRelationshipArgs
}

export interface IUpdateRelationshipArgs {
  relationship: IContactRelationship // TODO do we also want the omits here?
}

export interface IAddContactTypeArgs {
  type: ContactTypeEnum
  name: string
  tenantId: string
  description?: string
}

export interface IGetContactTypeArgs {
  contactTypeId: string
}

export interface IGetContactTypesArgs {
  filter?: FindContactTypeArgs
}

export interface IUpdateContactTypeArgs {
  contactType: Omit<IContactType, 'createdAt' | 'lastUpdatedAt'> // TODO do we also want the omits here?
}

export interface IRemoveContactTypeArgs {
  contactTypeId: string
}

export type IRequiredContext = IAgentContext<never>
