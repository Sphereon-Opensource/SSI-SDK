import { CredentialBrandingEntity } from '../../entities/issuanceBranding/CredentialBrandingEntity'
import { BaseLocaleBrandingEntity } from '../../entities/issuanceBranding/BaseLocaleBrandingEntity'
import { IssuerBrandingEntity } from '../../entities/issuanceBranding/IssuerBrandingEntity'
import { replaceNullWithUndefined } from '../FormattingUtils'
import { ICredentialBranding, IIssuerBranding, ILocaleBranding } from '../../types'

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
