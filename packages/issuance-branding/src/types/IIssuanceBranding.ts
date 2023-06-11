import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  ICredentialBranding,
  IIssuerBranding,
  IBasicImageDimensions,
  FindCredentialBrandingArgs,
  FindIssuerBrandingArgs,
  FindCredentialLocaleBrandingArgs,
  FindIssuerLocaleBrandingArgs,
  ILocaleBranding,
  ICredentialLocaleBranding,
  IIssuerLocaleBranding,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
} from '@sphereon/ssi-sdk.data-store'

export interface IIssuanceBranding extends IPluginMethodMap {
  ibAddCredentialBranding(args: IAddCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibGetCredentialBranding(args: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>>
  ibUpdateCredentialBranding(args: IUpdateCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibRemoveCredentialBranding(args: IRemoveCredentialBrandingArgs, context: IRequiredContext): Promise<IDeletionResult>
  ibAddCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibGetCredentialLocaleBranding(args: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialLocaleBranding>>
  ibRemoveCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<IDeletionResult>
  ibUpdateCredentialLocaleBranding(args: IUpdateCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialLocaleBranding>
  ibCredentialLocaleBrandingFrom(args: ICredentialBrandingFromArgs, context: IRequiredContext): Promise<IBasicCredentialLocaleBranding>
  ibAddIssuerBranding(args: IAddIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibGetIssuerBranding(args: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>>
  ibUpdateIssuerBranding(args: IUpdateIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibRemoveIssuerBranding(args: IRemoveIssuerBrandingArgs, context: IRequiredContext): Promise<IDeletionResult>
  ibAddIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibGetIssuerLocaleBranding(args: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerLocaleBranding>>
  ibRemoveIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IDeletionResult>
  ibUpdateIssuerLocaleBranding(args: IUpdateIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerLocaleBranding>
  ibIssuerLocaleBrandingFrom(args: IIssuerBrandingFromArgs, context: IRequiredContext): Promise<IBasicIssuerLocaleBranding>
}

export interface IGetCredentialBrandingArgs {
  filter?: FindCredentialBrandingArgs
}

export interface IAdditionalImageAttributes {
  mediaType?: string
  dataUri?: string
  dimensions: IBasicImageDimensions
}

export interface IUpdateCredentialBrandingArgs {
  credentialBranding: Omit<ICredentialBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveCredentialBrandingArgs {
  filter: FindCredentialBrandingArgs
}

export interface IUpdateIssuerBrandingArgs {
  issuerBranding: Omit<IIssuerBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveIssuerBrandingArgs {
  filter: FindIssuerBrandingArgs
}

export interface IAddIssuerBrandingArgs {
  issuerCorrelationId: string
  localeBranding: Array<IBasicIssuerLocaleBranding>
}

export interface IGetIssuerBrandingArgs {
  filter?: FindIssuerBrandingArgs
}

export interface IAddCredentialBrandingArgs {
  issuerCorrelationId: string
  vcHash: string
  localeBranding: Array<IBasicCredentialLocaleBranding>
}

export interface IAddCredentialLocaleBrandingArgs {
  credentialBrandingId: string
  localeBranding: Array<IBasicCredentialLocaleBranding>
}

export interface IAddIssuerLocaleBrandingArgs {
  issuerBrandingId: string
  localeBranding: Array<IBasicIssuerLocaleBranding>
}

export interface IGetCredentialLocaleBrandingArgs {
  filter?: FindCredentialLocaleBrandingArgs
}

export interface IGetIssuerLocaleBrandingArgs {
  filter?: FindIssuerLocaleBrandingArgs
}

export interface IRemoveCredentialLocaleBrandingArgs {
  filter: FindCredentialLocaleBrandingArgs
}

export interface IRemoveIssuerLocaleBrandingArgs {
  filter: FindIssuerLocaleBrandingArgs
}

export interface IUpdateCredentialLocaleBrandingArgs {
  localeBranding: Omit<ILocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface IUpdateIssuerLocaleBrandingArgs {
  localeBranding: Omit<ILocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface ICredentialBrandingFromArgs {
  localeBranding: IBasicCredentialLocaleBranding
}

export interface IIssuerBrandingFromArgs {
  localeBranding: IBasicIssuerLocaleBranding
}

export interface IDeletionResult {
  result: boolean
  error?: string
}

export type IRequiredContext = IAgentContext<never>
