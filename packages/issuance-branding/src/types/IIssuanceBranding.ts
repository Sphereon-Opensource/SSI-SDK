import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  IBasicLocaleBranding,
  ICredentialBranding,
  IIssuerBranding,
  IBasicBackgroundAttributes,
  IBasicImageAttributes,
  IBasicImageDimensions,
  FindCredentialBrandingArgs,
  FindIssuerBrandingArgs,
  FindCredentialLocaleBrandingArgs,
  FindIssuerLocaleBrandingArgs,
} from '@sphereon/ssi-sdk.data-store'

export interface IIssuanceBranding extends IPluginMethodMap {
  addCredentialBranding(args: IAddCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  getCredentialBranding(args: IGetCredentialBrandingArgs): Promise<Array<ICredentialBranding>>
  updateCredentialBranding(args: IUpdateCredentialBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  removeCredentialBranding(args: IRemoveCredentialBrandingArgs, context: IRequiredContext): Promise<void>

  addCredentialLocaleBranding(args: IAddCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<ICredentialBranding>
  getCredentialLocaleBranding(args: IGetCredentialLocaleBrandingArgs): Promise<Array<ICredentialBranding>>
  removeCredentialLocaleBranding(args: IRemoveCredentialLocaleBrandingArgs, context: IRequiredContext): Promise<void>

  addIssuerBranding(args: IAddIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  getIssuerBranding(args: IGetIssuerBrandingArgs): Promise<Array<IIssuerBranding>>
  updateIssuerBranding(args: IUpdateIssuerBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  removeIssuerBranding(args: IRemoveIssuerBrandingArgs, context: IRequiredContext): Promise<void>

  addIssuerLocaleBranding(args: IAddIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<IIssuerBranding>
  getIssuerLocaleBranding(args: IGetIssuerLocaleBrandingArgs): Promise<Array<IIssuerBranding>>
  removeIssuerLocaleBranding(args: IRemoveIssuerLocaleBrandingArgs, context: IRequiredContext): Promise<void>
}

export interface IAddCredentialBrandingArgs {
  issuerCorrelationId: string
  vcHash: string
  localeBranding: Array<ILocaleBranding>
}

export interface IGetCredentialBrandingArgs {
  filter?: FindCredentialBrandingArgs
}

export interface ILocaleBranding extends Omit<IBasicLocaleBranding, 'logo' | 'background'> {
  logo?: IImageAttributes
  background?: IBackgroundAttributes
}

export interface IBackgroundAttributes extends Omit<IBasicBackgroundAttributes, 'image'> {
  image?: IImageAttributes
}

export interface IImageAttributes extends Omit<IBasicImageAttributes, 'type' | 'base64Content' | 'dimensions'> {}

export interface IAdditionalImageAttributes {
  type: string
  base64Content?: string
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
  localeBranding: Array<IBasicLocaleBranding>
}

export interface IGetIssuerBrandingArgs {
  filter?: FindIssuerBrandingArgs
}

export interface IAddCredentialLocaleBrandingArgs {
  credentialBrandingId: string
  localeBranding: Array<IBasicLocaleBranding>
}

export interface IAddIssuerLocaleBrandingArgs {
  issuerBrandingId: string
  localeBranding: Array<IBasicLocaleBranding>
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

export type IRequiredContext = IAgentContext<never>
