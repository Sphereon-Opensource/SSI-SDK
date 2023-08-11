export interface ILocaleBranding {
  id: string
  alias?: string
  locale?: string
  logo?: IImageAttributes
  description?: string
  background?: IBackgroundAttributes
  text?: ITextAttributes
  createdAt: Date
  lastUpdatedAt: Date
}

export interface IImageAttributes {
  id: string
  uri?: string
  dataUri?: string
  mediaType?: string
  alt?: string
  dimensions?: IImageDimensions
}
export interface IBasicImageAttributes extends Omit<IImageAttributes, 'id' | 'dimensions'> {
  dimensions?: IBasicImageDimensions
}
export interface IPartialImageAttributes extends Partial<Omit<IImageAttributes, 'dimensions'>> {
  dimensions?: IPartialImageDimensions
}

export interface IBackgroundAttributes {
  id: string
  color?: string
  image?: IImageAttributes
}
export interface IBasicBackgroundAttributes extends Omit<IBackgroundAttributes, 'id' | 'image'> {
  image?: IBasicImageAttributes
}
export interface IPartialBackgroundAttributes extends Partial<Omit<IBackgroundAttributes, 'image'>> {
  image?: IPartialImageAttributes
}

export interface ITextAttributes {
  id: string
  color?: string
}
export interface IBasicTextAttributes extends Omit<ITextAttributes, 'id'> {}
export interface IPartialTextAttributes extends Partial<ITextAttributes> {}

export interface IImageDimensions {
  id: string
  width: number
  height: number
}
export interface IBasicImageDimensions extends Omit<IImageDimensions, 'id'> {}
export interface IPartialImageDimensions extends Partial<IImageDimensions> {}

export interface ICredentialLocaleBranding extends ILocaleBranding {}
export interface IBasicCredentialLocaleBranding
  extends Omit<ICredentialLocaleBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'logo' | 'background' | 'text'> {
  logo?: IBasicImageAttributes
  background?: IBasicBackgroundAttributes
  text?: IBasicTextAttributes
}
export interface IPartialCredentialLocaleBranding extends Partial<Omit<ICredentialLocaleBranding, 'logo' | 'background' | 'text'>> {
  logo?: IPartialImageAttributes
  background?: IPartialBackgroundAttributes
  text?: IPartialTextAttributes
}

export interface ICredentialBranding {
  id: string
  issuerCorrelationId: string
  vcHash: string
  localeBranding: Array<ICredentialLocaleBranding>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicCredentialBranding extends Omit<ICredentialBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'localeBranding'> {
  localeBranding: Array<IBasicCredentialLocaleBranding>
}
export interface IPartialCredentialBranding extends Partial<Omit<ICredentialBranding, 'localeBranding'>> {
  localeBranding?: IPartialCredentialLocaleBranding
}

export interface IIssuerLocaleBranding extends ILocaleBranding {}
export interface IBasicIssuerLocaleBranding
  extends Omit<IIssuerLocaleBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'logo' | 'background' | 'text'> {
  logo?: IBasicImageAttributes
  background?: IBasicBackgroundAttributes
  text?: IBasicTextAttributes
}
export interface IPartialIssuerLocaleBranding extends Partial<Omit<IIssuerLocaleBranding, 'logo' | 'background' | 'text'>> {
  logo?: IPartialImageAttributes
  background?: IPartialBackgroundAttributes
  text?: IPartialTextAttributes
}

export interface IIssuerBranding {
  id: string
  issuerCorrelationId: string
  localeBranding: Array<IIssuerLocaleBranding>
  createdAt: Date
  lastUpdatedAt: Date
}
export interface IBasicIssuerBranding extends Omit<IIssuerBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'localeBranding'> {
  localeBranding: Array<IBasicIssuerLocaleBranding>
}
export interface IPartialIssuerBranding extends Partial<Omit<ICredentialBranding, 'localeBranding'>> {
  localeBranding?: IPartialIssuerLocaleBranding
}

export interface ICredentialBrandingFilter extends IPartialCredentialBranding {}

export interface ICredentialLocaleBrandingFilter extends IPartialCredentialLocaleBranding {
  credentialBranding?: IPartialCredentialBranding
}

export interface IIssuerBrandingFilter extends IPartialIssuerBranding {}

export interface IIssuerLocaleBrandingFilter extends IPartialIssuerLocaleBranding {
  issuerBranding?: IPartialIssuerBranding
}
