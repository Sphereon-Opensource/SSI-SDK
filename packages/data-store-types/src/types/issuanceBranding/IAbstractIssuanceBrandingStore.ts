import {
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
  ICredentialBranding,
  ICredentialLocaleBrandingFilter,
  IIssuerBranding,
  IIssuerBrandingFilter,
  IIssuerLocaleBrandingFilter,
  ILocaleBranding,
  ICredentialBrandingFilter,
} from './issuanceBranding'

export type FindCredentialBrandingArgs = Array<ICredentialBrandingFilter>
export type FindCredentialLocaleBrandingArgs = Array<ICredentialLocaleBrandingFilter>
export type FindIssuerBrandingArgs = Array<IIssuerBrandingFilter>
export type FindIssuerLocaleBrandingArgs = Array<IIssuerLocaleBrandingFilter>

export interface IAddCredentialBrandingArgs {
  vcHash: string
  issuerCorrelationId: string
  localeBranding: Array<IBasicCredentialLocaleBranding>
}

export interface IGetCredentialBrandingArgs {
  filter?: FindCredentialBrandingArgs
}

export interface IUpdateCredentialBrandingArgs {
  credentialBranding: Omit<ICredentialBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveCredentialBrandingArgs {
  filter: FindCredentialBrandingArgs
}

export interface IAddCredentialLocaleBrandingArgs {
  credentialBrandingId: string
  localeBranding: Array<IBasicCredentialLocaleBranding>
}

export interface IUpdateCredentialLocaleBrandingArgs {
  localeBranding: Omit<ILocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveCredentialLocaleBrandingArgs {
  filter: FindCredentialLocaleBrandingArgs
}

export interface IGetCredentialLocaleBrandingArgs {
  filter?: FindCredentialLocaleBrandingArgs
}

export interface IAddIssuerBrandingArgs {
  issuerCorrelationId: string
  localeBranding: Array<IBasicIssuerLocaleBranding>
}

export interface IGetIssuerBrandingArgs {
  filter?: FindIssuerBrandingArgs
}

export interface IUpdateIssuerBrandingArgs {
  issuerBranding: Omit<IIssuerBranding, 'localeBranding' | 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveIssuerBrandingArgs {
  filter: FindIssuerBrandingArgs
}

export interface IAddIssuerLocaleBrandingArgs {
  issuerBrandingId: string
  localeBranding: Array<IBasicIssuerLocaleBranding>
}

export interface IUpdateIssuerLocaleBrandingArgs {
  localeBranding: Omit<ILocaleBranding, 'createdAt' | 'lastUpdatedAt'>
}

export interface IRemoveIssuerLocaleBrandingArgs {
  filter: FindIssuerLocaleBrandingArgs
}

export interface IGetIssuerLocaleBrandingArgs {
  filter?: FindIssuerLocaleBrandingArgs
}
