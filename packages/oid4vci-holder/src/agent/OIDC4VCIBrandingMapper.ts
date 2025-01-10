import { CredentialsSupportedDisplay, NameAndLocale } from '@sphereon/oid4vci-common'
import { IBasicCredentialClaim, IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store'
import { SdJwtClaimDisplayMetadata, SdJwtClaimMetadata, SdJwtClaimPath, SdJwtTypeDisplayMetadata } from '@sphereon/ssi-types'
import {
  IssuerLocaleBrandingFromArgs,
  Oid4vciCombineDisplayLocalesFromArgs,
  Oid4vciCredentialDisplayLocalesFromArgs,
  Oid4vciCredentialLocaleBrandingFromArgs,
  Oid4vciGetCredentialBrandingFromArgs,
  Oid4vciIssuerCredentialSubjectLocalesFromArgs,
  SdJwtCombineDisplayLocalesFromArgs,
  SdJwtCredentialClaimLocalesFromArgs,
  SdJwtCredentialDisplayLocalesFromArgs,
  SdJwtCredentialLocaleBrandingFromArgs,
  SdJwtGetCredentialBrandingFromArgs,
} from '../types/IOID4VCIHolder'

// FIXME should we not move this to the branding plugin?

export const oid4vciGetCredentialBrandingFrom = async (
  args: Oid4vciGetCredentialBrandingFromArgs,
): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const { credentialDisplay, issuerCredentialSubject } = args

  return oid4vciCombineDisplayLocalesFrom({
    ...(issuerCredentialSubject && { issuerCredentialSubjectLocales: await oid4vciIssuerCredentialSubjectLocalesFrom({ issuerCredentialSubject }) }),
    ...(credentialDisplay && { credentialDisplayLocales: await oid4vciCredentialDisplayLocalesFrom({ credentialDisplay }) }),
  })
}

export const oid4vciCredentialDisplayLocalesFrom = async (
  args: Oid4vciCredentialDisplayLocalesFromArgs,
): Promise<Map<string, CredentialsSupportedDisplay>> => {
  const { credentialDisplay } = args
  return credentialDisplay.reduce((localeDisplays, display) => {
    const localeKey = display.locale || ''
    localeDisplays.set(localeKey, display)
    return localeDisplays
  }, new Map<string, CredentialsSupportedDisplay>())
}

export const oid4vciIssuerCredentialSubjectLocalesFrom = async (
  args: Oid4vciIssuerCredentialSubjectLocalesFromArgs,
): Promise<Map<string, Array<IBasicCredentialClaim>>> => {
  const { issuerCredentialSubject } = args
  const localeClaims = new Map<string, Array<IBasicCredentialClaim>>()

  const processClaimObject = (claim: any, parentKey: string = ''): void => {
    Object.entries(claim).forEach(([key, value]): void => {
      if (key === 'mandatory' || key === 'value_type') {
        return
      }

      if (key === 'display' && Array.isArray(value)) {
        value.forEach(({ name, locale = '' }: NameAndLocale): void => {
          if (!name) {
            return
          }

          //const localeKey = locale || ''
          if (!localeClaims.has(locale)) {
            localeClaims.set(locale, [])
          }
          localeClaims.get(locale)!.push({ key: parentKey, name })
        })
      } else if (typeof value === 'object' && value !== null) {
        processClaimObject(value, parentKey ? `${parentKey}.${key}` : key)
      }
    })
  }

  processClaimObject(issuerCredentialSubject)
  return localeClaims
}

export const oid4vciCredentialLocaleBrandingFrom = async (args: Oid4vciCredentialLocaleBrandingFromArgs): Promise<IBasicCredentialLocaleBranding> => {
  const { credentialDisplay } = args

  return {
    ...(credentialDisplay.name && {
      alias: credentialDisplay.name,
    }),
    ...(credentialDisplay.locale && {
      locale: credentialDisplay.locale,
    }),
    ...(credentialDisplay.logo && {
      logo: {
        ...((credentialDisplay.logo.url || <string>credentialDisplay.logo.uri) && {
          uri: credentialDisplay.logo?.url ?? <string>credentialDisplay.logo.uri,
        }),
        ...(credentialDisplay.logo.alt_text && {
          alt: credentialDisplay.logo?.alt_text,
        }),
      },
    }),
    ...(credentialDisplay.description && {
      description: credentialDisplay.description,
    }),

    ...(credentialDisplay.text_color && {
      text: {
        color: credentialDisplay.text_color,
      },
    }),
    ...((credentialDisplay.background_image || credentialDisplay.background_color) && {
      background: {
        ...(credentialDisplay.background_image && {
          image: {
            ...((credentialDisplay.background_image.url || <string>credentialDisplay.background_image.uri) && {
              uri: credentialDisplay.background_image?.url ?? <string>credentialDisplay.background_image.uri,
            }),
            ...(credentialDisplay.background_image.alt_text && {
              alt: credentialDisplay.background_image?.alt_text,
            }),
          },
        }),
        ...(credentialDisplay.background_color && {
          color: credentialDisplay.background_color,
        }),
      },
    }),
  }
}

export const oid4vciCombineDisplayLocalesFrom = async (
  args: Oid4vciCombineDisplayLocalesFromArgs,
): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const {
    credentialDisplayLocales = new Map<string, CredentialsSupportedDisplay>(),
    issuerCredentialSubjectLocales = new Map<string, Array<IBasicCredentialClaim>>(),
  } = args

  const locales: Array<string> = Array.from(new Set([...issuerCredentialSubjectLocales.keys(), ...credentialDisplayLocales.keys()]))

  return Promise.all(
    locales.map(async (locale: string): Promise<IBasicCredentialLocaleBranding> => {
      const display = credentialDisplayLocales.get(locale)
      const claims = issuerCredentialSubjectLocales.get(locale)

      return {
        ...(display && (await oid4vciCredentialLocaleBrandingFrom({ credentialDisplay: display }))),
        ...(locale.length > 0 && { locale }),
        claims,
      }
    }),
  )
}

export const sdJwtGetCredentialBrandingFrom = async (args: SdJwtGetCredentialBrandingFromArgs): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const { credentialDisplay, claimsMetadata } = args

  return sdJwtCombineDisplayLocalesFrom({
    ...(claimsMetadata && { claimsMetadata: await sdJwtCredentialClaimLocalesFrom({ claimsMetadata }) }),
    ...(credentialDisplay && { credentialDisplayLocales: await sdJwtCredentialDisplayLocalesFrom({ credentialDisplay }) }),
  })
}

export const sdJwtCredentialDisplayLocalesFrom = async (
  args: SdJwtCredentialDisplayLocalesFromArgs,
): Promise<Map<string, SdJwtTypeDisplayMetadata>> => {
  const { credentialDisplay } = args
  return credentialDisplay.reduce((localeDisplays, display) => {
    const localeKey = display.lang || ''
    localeDisplays.set(localeKey, display)
    return localeDisplays
  }, new Map<string, SdJwtTypeDisplayMetadata>())
}

export const sdJwtCredentialClaimLocalesFrom = async (
  args: SdJwtCredentialClaimLocalesFromArgs,
): Promise<Map<string, Array<IBasicCredentialClaim>>> => {
  const { claimsMetadata } = args
  const localeClaims = new Map<string, Array<IBasicCredentialClaim>>()

  claimsMetadata.forEach((claim: SdJwtClaimMetadata): void => {
    claim.display?.forEach((display: SdJwtClaimDisplayMetadata): void => {
      const { lang = '', label } = display
      const key = claim.path.map((value: SdJwtClaimPath) => String(value)).join('.')
      if (!localeClaims.has(lang)) {
        localeClaims.set(lang, [])
      }
      localeClaims.get(lang)!.push({ key, name: label })
    })
  })

  return localeClaims
}

export const sdJwtCredentialLocaleBrandingFrom = async (args: SdJwtCredentialLocaleBrandingFromArgs): Promise<IBasicCredentialLocaleBranding> => {
  const { credentialDisplay } = args

  return {
    ...(credentialDisplay.name && {
      alias: credentialDisplay.name,
    }),
    ...(credentialDisplay.lang && {
      locale: credentialDisplay.lang,
    }),
    ...(credentialDisplay.rendering?.simple?.logo && {
      logo: {
        ...(credentialDisplay.rendering.simple.logo.uri && {
          uri: credentialDisplay.rendering.simple.logo.uri,
        }),
        ...(credentialDisplay.rendering.simple.logo.alt_text && {
          alt: credentialDisplay.rendering.simple.logo.alt_text,
        }),
      },
    }),
    ...(credentialDisplay.description && {
      description: credentialDisplay.description,
    }),
    ...(credentialDisplay.rendering?.simple?.text_color && {
      text: {
        color: credentialDisplay.rendering.simple.text_color,
      },
    }),
    ...(credentialDisplay.rendering?.simple?.background_color && {
      background: {
        color: credentialDisplay.rendering.simple.background_color,
      },
    }),
  }
}

export const sdJwtCombineDisplayLocalesFrom = async (args: SdJwtCombineDisplayLocalesFromArgs): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const { credentialDisplayLocales = new Map<string, SdJwtTypeDisplayMetadata>(), claimsMetadata = new Map<string, Array<IBasicCredentialClaim>>() } =
    args

  const locales: Array<string> = Array.from(new Set([...claimsMetadata.keys(), ...credentialDisplayLocales.keys()]))

  return Promise.all(
    locales.map(async (locale: string): Promise<IBasicCredentialLocaleBranding> => {
      const display = credentialDisplayLocales.get(locale)
      const claims = claimsMetadata.get(locale)

      return {
        ...(display && (await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display }))),
        ...(locale.length > 0 && { locale }),
        claims,
      }
    }),
  )
}

// TODO since dynamicRegistrationClientMetadata can also be on a RP, we should start using this mapper in a more general way
export const issuerLocaleBrandingFrom = async (args: IssuerLocaleBrandingFromArgs): Promise<IBasicIssuerLocaleBranding> => {
  const { issuerDisplay, dynamicRegistrationClientMetadata } = args

  return {
    ...(dynamicRegistrationClientMetadata?.client_name && {
      alias: dynamicRegistrationClientMetadata.client_name,
    }),
    ...(issuerDisplay.name && {
      alias: issuerDisplay.name,
    }),
    ...(issuerDisplay.locale && {
      locale: issuerDisplay.locale,
    }),
    ...((issuerDisplay.logo || dynamicRegistrationClientMetadata?.logo_uri) && {
      logo: {
        ...(dynamicRegistrationClientMetadata?.logo_uri && {
          uri: dynamicRegistrationClientMetadata?.logo_uri,
        }),
        ...((issuerDisplay.logo?.url || <string>issuerDisplay.logo?.uri) && {
          uri: issuerDisplay.logo?.url ?? <string>issuerDisplay.logo?.uri,
        }),
        ...(issuerDisplay.logo?.alt_text && {
          alt: issuerDisplay.logo?.alt_text,
        }),
      },
    }),
    ...(issuerDisplay.description && {
      description: issuerDisplay.description,
    }),
    ...(issuerDisplay.text_color && {
      text: {
        color: issuerDisplay.text_color,
      },
    }),
    ...(dynamicRegistrationClientMetadata?.client_uri && {
      clientUri: dynamicRegistrationClientMetadata.client_uri,
    }),
    ...(dynamicRegistrationClientMetadata?.tos_uri && {
      tosUri: dynamicRegistrationClientMetadata.tos_uri,
    }),
    ...(dynamicRegistrationClientMetadata?.policy_uri && {
      policyUri: dynamicRegistrationClientMetadata.policy_uri,
    }),
    ...(dynamicRegistrationClientMetadata?.contacts && {
      contacts: dynamicRegistrationClientMetadata.contacts,
    }),
  }
}
