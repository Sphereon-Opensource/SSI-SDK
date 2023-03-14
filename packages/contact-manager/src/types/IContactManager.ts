import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { FindContactArgs, IBasicIdentity, IContact, IIdentity } from '@sphereon/ssi-sdk-data-store'

export interface IContactManager extends IPluginMethodMap {
  cmGetContact(args: IGetContactArgs, context: IRequiredContext): Promise<IContact>
  cmGetContacts(args?: IGetContactsArgs): Promise<Array<IContact>>
  cmAddContact(args: IAddContactArgs, context: IRequiredContext): Promise<IContact>
  cmUpdateContact(args: IUpdateContactArgs, context: IRequiredContext): Promise<IContact>
  cmRemoveContact(args: IRemoveContactArgs, context: IRequiredContext): Promise<boolean>
  cmGetIdentity(args: IGetIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmGetIdentities(args: IGetIdentitiesArgs, context: IRequiredContext): Promise<Array<IIdentity>>
  cmAddIdentity(args: IAddIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmUpdateIdentity(args: IUpdateIdentityArgs, context: IRequiredContext): Promise<IIdentity>
  cmRemoveIdentity(args: IRemoveIdentityArgs, context: IRequiredContext): Promise<boolean>
}

export interface IGetContactArgs {
  contactId: string
}

export interface IGetContactsArgs {
  filter?: FindContactArgs
}

export interface IAddContactArgs {
  name: string
  alias: string
  uri?: string
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
  contactId: string
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

export type IRequiredContext = IAgentContext<never>
