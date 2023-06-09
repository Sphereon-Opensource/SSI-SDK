import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  ICredentialBranding,
  IIssuerBranding,
  IBasicBackgroundAttributes,
  IBasicImageAttributes,
  IBasicImageDimensions,
  FindCredentialBrandingArgs,
  FindIssuerBrandingArgs,
  FindCredentialLocaleBrandingArgs,
  FindIssuerLocaleBrandingArgs,
  ILocaleBranding as LocaleBranding,
  IBasicTextAttributes,
  ICredentialLocaleBranding as CredentialLocaleBranding,
  IIssuerLocaleBranding as IssuerLocaleBranding,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding
} from '@sphereon/ssi-sdk.data-store'

export interface IIssuanceBranding extends IPluginMethodMap {
  ibAddCredentialBranding(args: IAddCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibGetCredentialBranding(args: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>>
  ibUpdateCredentialBranding(args: IUpdateCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibRemoveCredentialBranding(args: IRemoveCredentialBrandingArgs, context: IRequiredContext): Promise<boolean>
  ibAddCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  ibGetCredentialLocaleBranding(args: IGetCredentialLocaleBrandingArgs): Promise<Array<CredentialLocaleBranding>>
  ibRemoveCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<boolean>
  ibUpdateCredentialLocaleBranding(args: IUpdateCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<CredentialLocaleBranding>
  ibCredentialLocaleBrandingFrom(args: ICredentialBrandingFromArgs, context: IRequiredContext): Promise<IBasicCredentialLocaleBranding>
  ibAddIssuerBranding(args: IAddIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibGetIssuerBranding(args: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>>
  ibUpdateIssuerBranding(args: IUpdateIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibRemoveIssuerBranding(args: IRemoveIssuerBrandingArgs, context: IRequiredContext): Promise<boolean>
  ibAddIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  ibGetIssuerLocaleBranding(args: IGetIssuerLocaleBrandingArgs): Promise<Array<IssuerLocaleBranding>>
  ibRemoveIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<boolean>
  ibUpdateIssuerLocaleBranding(args: IUpdateIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IssuerLocaleBranding>
  ibIssuerLocaleBrandingFrom(args: IIssuerBrandingFromArgs, context: IRequiredContext): Promise<IBasicIssuerLocaleBranding>
}

export interface IGetCredentialBrandingArgs {
  filter?: FindCredentialBrandingArgs
}

export interface ILocaleBranding {
  alias?: string
  locale?: string
  logo?: IImageAttributes
  description?: string
  text?: IBasicTextAttributes
  background?: IBackgroundAttributes
}
export interface ICredentialLocaleBranding extends ILocaleBranding {}
export interface IIssuerLocaleBranding extends ILocaleBranding {}

export interface IBackgroundAttributes extends Omit<IBasicBackgroundAttributes, 'image'> {
  image?: IImageAttributes
}

export interface IImageAttributes extends Omit<IBasicImageAttributes, 'type' | 'dataUri' | 'dimensions'> {}

export interface IAdditionalImageAttributes {
  mediaType?: string
  dataUri?: string
  dimensions: IBasicImageDimensions
}

export interface IUpdateCredentialBrandingArgs {
  credentialBranding: Omit<ICredentialBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveCredentialBrandingArgs {
  credentialBrandingId: string
}

export interface IUpdateIssuerBrandingArgs {
  issuerBranding: Omit<IIssuerBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveIssuerBrandingArgs {
  issuerBrandingId: string
}

export interface IAddIssuerBrandingArgs {
  issuerCorrelationId: string
  localeBranding: Array<IIssuerLocaleBranding>
}

export interface IGetIssuerBrandingArgs {
  filter?: FindIssuerBrandingArgs
}

export interface IAddCredentialBrandingArgs {
  issuerCorrelationId: string
  vcHash: string
  localeBranding: Array<ICredentialLocaleBranding>
}

export interface IAddCredentialLocaleBrandingArgs {
  credentialBrandingId: string
  localeBranding: Array<ICredentialLocaleBranding>
}

export interface IAddIssuerLocaleBrandingArgs {
  issuerBrandingId: string
  localeBranding: Array<IIssuerLocaleBranding>
}

export interface IGetCredentialLocaleBrandingArgs {
  filter?: FindCredentialLocaleBrandingArgs
}

export interface IGetIssuerLocaleBrandingArgs {
  filter?: FindIssuerLocaleBrandingArgs
}

export interface IRemoveCredentialLocaleBrandingArgs {
  credentialLocaleBrandingId: string
}

export interface IRemoveIssuerLocaleBrandingArgs {
  issuerLocaleBrandingId: string
}

export interface IUpdateCredentialLocaleBrandingArgs {
  localeBranding: Omit<LocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface IUpdateIssuerLocaleBrandingArgs {
  localeBranding: Omit<LocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface ICredentialBrandingFromArgs {
  localeBranding: ICredentialLocaleBranding
}

export interface IIssuerBrandingFromArgs {
  localeBranding: IIssuerLocaleBranding
}

export type IRequiredContext = IAgentContext<never>
