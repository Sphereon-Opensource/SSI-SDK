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

// export interface IBasicLocaleBranding extends Omit<ILocaleBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'logo' | 'background' | 'text'> {
//   logo?: IBasicImageAttributes
//   background?: IBasicBackgroundAttributes
//   text?: IBasicTextAttributes
// }

export interface IImageAttributes {
  id: string
  uri?: string
  base64Content?: string
  type?: string
  alt?: string
  dimensions?: IImageDimensions
}
export interface IBasicImageAttributes extends Omit<IImageAttributes, 'id' | 'dimensions'> {
  dimensions?: IBasicImageDimensions
}

export interface IBackgroundAttributes {
  id: string
  color?: string
  image?: IImageAttributes
}
export interface IBasicBackgroundAttributes extends Omit<IBackgroundAttributes, 'id' | 'image'> {
  image?: IBasicImageAttributes
}

export interface ITextAttributes {
  id: string
  color?: string
}
export interface IBasicTextAttributes extends Omit<ITextAttributes, 'id'> {}

export interface IImageDimensions {
  id: string
  width: number
  height: number
}
export interface IBasicImageDimensions extends Omit<IImageDimensions, 'id'> {}

export interface ICredentialLocaleBranding extends ILocaleBranding {}
export interface IBasicCredentialLocaleBranding extends Omit<ICredentialLocaleBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'logo' | 'background' | 'text'> {
  logo?: IBasicImageAttributes
  background?: IBasicBackgroundAttributes
  text?: IBasicTextAttributes
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

export interface IIssuerLocaleBranding extends ILocaleBranding {}
export interface IBasicIssuerLocaleBranding extends Omit<IIssuerLocaleBranding, 'id' | 'createdAt' | 'lastUpdatedAt' | 'logo' | 'background' | 'text'> {
  logo?: IBasicImageAttributes
  background?: IBasicBackgroundAttributes
  text?: IBasicTextAttributes
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
