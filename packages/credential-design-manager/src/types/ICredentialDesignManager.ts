import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import { CredentialDesign, IBasicImageAttributes } from '@sphereon/ssi-sdk.data-store-types'

export interface ICredentialDesignManager extends IPluginMethodMap {
  cdmGetCredentialDesign(args: GetCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmGetCredentialDesigns(args?: GetCredentialDesignsArgs): Promise<Array<CredentialDesign>>
  cdmAddCredentialDesign(args: AddCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmUpdateCredentialDesign(args: UpdateCredentialDesignArgs, context: RequiredContext): Promise<CredentialDesign>
  cdmRemoveCredentialDesign(args: RemoveCredentialDesignArgs, context: RequiredContext): Promise<RemoveCredentialDesignResult>
  cdmCredentialDesignCount(args: CredentialDesignCountArgs, context: RequiredContext): Promise<CredentialDesignCountResult>
  cdmFormStepGetOrCreate(args: FormStepGetOrCreateArgs, context: RequiredContext): Promise<FormStepGetOrCreateResult>
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
  limit?: number
  offset?: number
}

export type AddCredentialDesignArgs = {
  identifier: string
  tenantId?: string
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | Array<Record<string, unknown>>
  options: CredentialConfigurationOptions
  isAdvancedSchema?: boolean
  branding?: CredentialDesignBrandingInput
  formStepId?: string
  statusListUri?: string
}

export type UpdateCredentialDesignArgs = {
  credentialDesignId: string
  identifier: string
  tenantId?: string
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown> | Array<Record<string, unknown>>
  options: CredentialConfigurationOptions
  isAdvancedSchema?: boolean
  branding?: CredentialDesignBrandingInput
}

export type RemoveCredentialDesignArgs = {
  credentialDesignId: string
}

export type RemoveCredentialDesignResult = {
  result: boolean
}

export type CredentialDesignCountArgs = {
  filter?: {
    tenantId?: string
  }
}

export type CredentialDesignCountResult = {
  count: number
}

export type FormStepGetOrCreateArgs = {
  formId: string
}

export type FormStepGetOrCreateResult = {
  formStepId: string
}

export type CredentialConfigurationOptions = {
  format: string
  vct?: string
  scope?: string
  cryptographicBindingMethodsSupported?: Array<string>
  credentialSigningAlgValuesSupported?: Array<string>
  proofTypesSupported?: Record<string, unknown>
}

export type CredentialDesignBrandingInput = {
  logo?: IBasicImageAttributes
  backgroundImage?: IBasicImageAttributes
  textColor?: string
  backgroundColor?: string
}

export type RequiredContext = IAgentContext<never>
