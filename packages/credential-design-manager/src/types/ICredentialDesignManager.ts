import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialDesign, NonPersistedCredentialDesign } from '@sphereon/ssi-sdk.data-store-types'
import { CredentialFormat } from '@sphereon/ssi-types'

export interface ICredentialDesignManager extends IPluginMethodMap {
  cdmGetCredentialDesign(args: GetCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmGetCredentialDesigns(args: GetCredentialDesignsArgs, context: RequiredContext): Promise<Array<CredentialDesign>>
  cdmAddCredentialDesign(args: AddCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmUpdateCredentialDesign(args: UpdateCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmRemoveCredentialDesign(args: RemoveCredentialDesignArgs, context: RequiredContext): Promise<RemoveCredentialDesignResult>
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
  identifier: string
  schema: CredentialSchema
  uiSchema: CredentialUISchema
  options: {
    format: CredentialFormat
    vct?: string,//options.vct ?? null,
    scope?: string
    cryptographicBindingMethodsSupported: Array<string>
    credentialSigningAlgValuesSupported: Array<string>
    proofTypesSupported: Record<string, any>
  }
  isAdvancedSchema: boolean
  branding: {
    logo: {
      uri: string
    }
    backgroundImage: {
      uri: string
    }
    textColor: string
    backgroundColor: string
  }
  //name: string
  //tenantId?: string
  //design?: NonPersistedCredentialDesign
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

export type RemoveCredentialDesignResult = {
  result: boolean
}

export type RequiredContext = IAgentContext<never>
