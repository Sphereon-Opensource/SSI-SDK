import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialDesign, NonPersistedCredentialDesign } from '@sphereon/ssi-sdk.data-store-types'

export interface ICredentialDesignManager extends IPluginMethodMap {
  cdmGetCredentialDesign(args: GetCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmGetCredentialDesigns(args: GetCredentialDesignsArgs, context: RequiredContext): Promise<Array<CredentialDesign>>
  cdmAddCredentialDesign(args: AddCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmUpdateCredentialDesign(args: UpdateCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmRemoveCredentialDesign(args: RemoveCredentialDesignArgs, context: RequiredContext): Promise<boolean>
}

export function contextHasCredentialDesignManager(context: IAgentContext<IPluginMethodMap>): context is IAgentContext<ICredentialDesignManager> {
  return contextHasPlugin(context, 'cdmGetCredentialDesign')
}

export type GetCredentialDesignArgs = {
  credentialDesignId: string
}

export type GetCredentialDesignsArgs = {
  filter?: {
    tenantId?: string
  }
}

export type AddCredentialDesignArgs = {
  name: string
  tenantId?: string
  design?: NonPersistedCredentialDesign
}

export type UpdateCredentialDesignArgs = {
  credentialDesignId: string
  name?: string
  tenantId?: string
  design?: Partial<NonPersistedCredentialDesign>
}

export type RemoveCredentialDesignArgs = {
  credentialDesignId: string
}

export type RequiredContext = IAgentContext<never>
