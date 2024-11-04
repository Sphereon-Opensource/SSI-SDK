import { replaceNullWithUndefined } from '../FormattingUtils'
import { isEmptyString } from '../../entities/validators'
import { CredentialBrandingEntity } from '../../entities/issuanceBranding/CredentialBrandingEntity'
import { BaseLocaleBrandingEntity } from '../../entities/issuanceBranding/BaseLocaleBrandingEntity'
import { IssuerBrandingEntity } from '../../entities/issuanceBranding/IssuerBrandingEntity'
import { ImageAttributesEntity } from '../../entities/issuanceBranding/ImageAttributesEntity'
import { BackgroundAttributesEntity } from '../../entities/issuanceBranding/BackgroundAttributesEntity'
import { TextAttributesEntity } from '../../entities/issuanceBranding/TextAttributesEntity'
import { IssuerLocaleBrandingEntity } from '../../entities/issuanceBranding/IssuerLocaleBrandingEntity'
import { CredentialLocaleBrandingEntity } from '../../entities/issuanceBranding/CredentialLocaleBrandingEntity'
import { ImageDimensionsEntity } from '../../entities/issuanceBranding/ImageDimensionsEntity'
import {
  IBasicBackgroundAttributes,
  IBasicCredentialBranding,
  IBasicCredentialLocaleBranding,
  IBasicImageAttributes,
  IBasicImageDimensions,
  IBasicIssuerBranding,
  IBasicIssuerLocaleBranding,
  IBasicTextAttributes,
  ICredentialBranding,
  IIssuerBranding,
  ILocaleBranding
} from '../../types'

export const credentialBrandingFrom = (credentialBranding: CredentialBrandingEntity): ICredentialBranding => {
  const result: ICredentialBranding = {
    ...credentialBranding,
    localeBranding: credentialBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => localeBrandingFrom(localeBranding)),
  }

  return replaceNullWithUndefined(result)
}

export const issuerBrandingFrom = (issuerBranding: IssuerBrandingEntity): IIssuerBranding => {
  const result: IIssuerBranding = {
    ...issuerBranding,
    localeBranding: issuerBranding.localeBranding.map((localeBranding: BaseLocaleBrandingEntity) => localeBrandingFrom(localeBranding)),
  }

  return replaceNullWithUndefined(result)
}

export const localeBrandingFrom = (localeBranding: BaseLocaleBrandingEntity): ILocaleBranding => {
  const result: ILocaleBranding = {
    ...localeBranding,
    locale: localeBranding.locale === '' ? undefined : localeBranding.locale,
  }

  return replaceNullWithUndefined(result)
}


export const issuerLocaleBrandingEntityFrom = (args: IBasicIssuerLocaleBranding): IssuerLocaleBrandingEntity => {
  const issuerLocaleBrandingEntity: IssuerLocaleBrandingEntity = new IssuerLocaleBrandingEntity()
  issuerLocaleBrandingEntity.alias = isEmptyString(args.alias) ? undefined : args.alias
  issuerLocaleBrandingEntity.locale = args.locale ? args.locale : ''
  issuerLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  issuerLocaleBrandingEntity.description = isEmptyString(args.description) ? undefined : args.description
  issuerLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  issuerLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined
  issuerLocaleBrandingEntity.clientUri = isEmptyString(args.clientUri) ? undefined : args.clientUri
  issuerLocaleBrandingEntity.tosUri = isEmptyString(args.tosUri) ? undefined : args.tosUri
  issuerLocaleBrandingEntity.policyUri = isEmptyString(args.policyUri) ? undefined : args.policyUri
  issuerLocaleBrandingEntity.contacts = args.contacts

  return issuerLocaleBrandingEntity
}

export const backgroundAttributesEntityFrom = (args: IBasicBackgroundAttributes): BackgroundAttributesEntity => {
  const backgroundAttributesEntity: BackgroundAttributesEntity = new BackgroundAttributesEntity()
  backgroundAttributesEntity.color = isEmptyString(args.color) ? undefined : args.color
  backgroundAttributesEntity.image = args.image ? imageAttributesEntityFrom(args.image) : undefined

  return backgroundAttributesEntity
}

export const credentialBrandingEntityFrom = (args: IBasicCredentialBranding): CredentialBrandingEntity => {
  const credentialBrandingEntity: CredentialBrandingEntity = new CredentialBrandingEntity()
  credentialBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  credentialBrandingEntity.vcHash = args.vcHash
  credentialBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicCredentialLocaleBranding) =>
    credentialLocaleBrandingEntityFrom(localeBranding),
  )

  return credentialBrandingEntity
}

export const credentialLocaleBrandingEntityFrom = (args: IBasicCredentialLocaleBranding): CredentialLocaleBrandingEntity => {
  const credentialLocaleBrandingEntity: CredentialLocaleBrandingEntity = new CredentialLocaleBrandingEntity()
  credentialLocaleBrandingEntity.alias = isEmptyString(args.alias) ? undefined : args.alias
  credentialLocaleBrandingEntity.locale = args.locale ? args.locale : ''
  credentialLocaleBrandingEntity.logo = args.logo ? imageAttributesEntityFrom(args.logo) : undefined
  credentialLocaleBrandingEntity.description = isEmptyString(args.description) ? undefined : args.description
  credentialLocaleBrandingEntity.background = args.background ? backgroundAttributesEntityFrom(args.background) : undefined
  credentialLocaleBrandingEntity.text = args.text ? textAttributesEntityFrom(args.text) : undefined

  return credentialLocaleBrandingEntity
}

export const imageAttributesEntityFrom = (args: IBasicImageAttributes): ImageAttributesEntity => {
  const imageAttributesEntity: ImageAttributesEntity = new ImageAttributesEntity()
  imageAttributesEntity.uri = isEmptyString(args.uri) ? undefined : args.uri
  imageAttributesEntity.dataUri = isEmptyString(args.dataUri) ? undefined : args.dataUri
  imageAttributesEntity.mediaType = isEmptyString(args.mediaType) ? undefined : args.mediaType
  imageAttributesEntity.alt = isEmptyString(args.alt) ? undefined : args.alt
  imageAttributesEntity.dimensions = args.dimensions ? imageDimensionsEntityFrom(args.dimensions) : undefined

  return imageAttributesEntity
}

export const imageDimensionsEntityFrom = (args: IBasicImageDimensions): ImageDimensionsEntity => {
  const imageDimensionsEntity: ImageDimensionsEntity = new ImageDimensionsEntity()
  imageDimensionsEntity.width = args.width
  imageDimensionsEntity.height = args.height

  return imageDimensionsEntity
}

export const issuerBrandingEntityFrom = (args: IBasicIssuerBranding): IssuerBrandingEntity => {
  const issuerBrandingEntity: IssuerBrandingEntity = new IssuerBrandingEntity()
  issuerBrandingEntity.issuerCorrelationId = args.issuerCorrelationId
  issuerBrandingEntity.localeBranding = args.localeBranding.map((localeBranding: IBasicIssuerLocaleBranding) =>
    issuerLocaleBrandingEntityFrom(localeBranding),
  )

  return issuerBrandingEntity
}

export const textAttributesEntityFrom = (args: IBasicTextAttributes): TextAttributesEntity => {
  const textAttributesEntity: TextAttributesEntity = new TextAttributesEntity()
  textAttributesEntity.color = isEmptyString(args.color) ? undefined : args.color

  return textAttributesEntity
}
