import { CredentialsSupportedDisplay, NameAndLocale } from '@sphereon/oid4vci-common'
import { IBasicCredentialClaim, IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store-types'
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
  let claimIndex = 0

  const processClaimObject = (claim: any, parentKey: string = ''): void => {
    Object.entries(claim).forEach(([key, value]): void => {
      if (key === 'mandatory' || key === 'value_type') {
        return
      }

      if (key === 'display' && Array.isArray(value)) {
        const order = claimIndex++
        value.forEach(({ name, locale = '' }: NameAndLocale): void => {
          if (!localeClaims.has(locale)) {
            localeClaims.set(locale, [])
          }
          localeClaims.get(locale)!.push({ key: parentKey, name: name || parentKey, order })
        })
      } else if (typeof value === 'object' && value !== null) {
        processClaimObject(value, parentKey ? `${parentKey}.${key}` : key)
      }
    })
  }

  // OID4VCI draft >= 14 / 1.0: `claims` is an ARRAY of { path: [...], display: [{ name, locale }], mandatory? }.
  // Derive the claim key from `path` (like the SD-JWT type-metadata claims), so locale labels actually map to the claim.
  // The legacy `credentialSubject` form is a nested object and is handled by processClaimObject below.
  if (Array.isArray(issuerCredentialSubject)) {
    issuerCredentialSubject.forEach((claim: any, index: number): void => {
      const path: Array<unknown> = Array.isArray(claim?.path) ? claim.path : []
      if (path.length === 0) {
        return
      }
      const key = path.map((value: unknown) => String(value)).join('.')
      const display: Array<NameAndLocale> = Array.isArray(claim?.display) ? claim.display : []
      if (display.length > 0) {
        display.forEach(({ name, locale = '' }: NameAndLocale): void => {
          if (!localeClaims.has(locale)) {
            localeClaims.set(locale, [])
          }
          localeClaims.get(locale)!.push({ key, name: name || key, order: index })
        })
      } else {
        if (!localeClaims.has('')) {
          localeClaims.set('', [])
        }
        localeClaims.get('')!.push({ key, name: key, order: index })
      }
    })
    return localeClaims
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
        ...((credentialDisplay.logo.uri || <string>credentialDisplay.logo.uri) && {
          uri: credentialDisplay.logo?.uri ?? <string>credentialDisplay.logo.uri,
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
            ...((credentialDisplay.background_image.uri || <string>credentialDisplay.background_image.uri) && {
              uri: credentialDisplay.background_image?.uri ?? <string>credentialDisplay.background_image.uri,
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

  // Resolve the best entry for a requested locale so every combined record is self-complete, even when
  // an issuer advertises branding/claims only under a single (e.g. region-suffixed) locale. Resolution
  // order: exact match → language-prefix match (e.g. "nl" ↔ "nl-NL") → no-locale (issuer default) entry →
  // first available entry as a sane default. The last two also populate the no-locale ('') record itself,
  // so a wallet whose locale isn't advertised (which falls back to the no-locale record at display time)
  // still gets the issuer's logo/background and claim labels.
  const resolveByLocale = <V>(map: Map<string, V>, locale: string): V | undefined => {
    const exact = map.get(locale)
    if (exact !== undefined) return exact
    if (locale) {
      const lang = locale.split('-')[0]
      for (const [key, value] of map) {
        if (key && key.split('-')[0] === lang) {
          return value
        }
      }
    }
    const noLocale = map.get('')
    if (noLocale !== undefined) return noLocale
    return map.values().next().value
  }

  return Promise.all(
    locales.map(async (locale: string): Promise<IBasicCredentialLocaleBranding> => {
      const display = resolveByLocale(credentialDisplayLocales, locale)
      const claims = resolveByLocale(issuerCredentialSubjectLocales, locale)

      const branding: IBasicCredentialLocaleBranding = {
        ...(display && (await oid4vciCredentialLocaleBrandingFrom({ credentialDisplay: display }))),
        claims,
      }
      // The record's locale must reflect the target locale, not the (possibly borrowed) display's locale.
      // For the no-locale ('') record, ensure no locale leaks in from a borrowed localized display.
      if (locale.length > 0) {
        branding.locale = locale
      } else {
        delete branding.locale
      }
      return branding
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
    const localeKey = display.locale || display.lang || ''
    localeDisplays.set(localeKey, display)
    return localeDisplays
  }, new Map<string, SdJwtTypeDisplayMetadata>())
}

export const sdJwtCredentialClaimLocalesFrom = async (
  args: SdJwtCredentialClaimLocalesFromArgs,
): Promise<Map<string, Array<IBasicCredentialClaim>>> => {
  const { claimsMetadata } = args
  const localeClaims = new Map<string, Array<IBasicCredentialClaim>>()

  claimsMetadata.forEach((claim: SdJwtClaimMetadata, index: number): void => {
    const key = claim.path.map((value: SdJwtClaimPath) => String(value)).join('.')
    if (claim.display && claim.display.length > 0) {
      claim.display.forEach((display: SdJwtClaimDisplayMetadata): void => {
        const localeKey = display.locale || display.lang || ''
        if (!localeClaims.has(localeKey)) {
          localeClaims.set(localeKey, [])
        }
        localeClaims.get(localeKey)!.push({ key, name: display.label || key, order: index })
      })
    } else {
      if (!localeClaims.has('')) {
        localeClaims.set('', [])
      }
      localeClaims.get('')!.push({ key, name: key, order: index })
    }
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
    ...((credentialDisplay.rendering?.simple?.background_image || credentialDisplay.rendering?.simple?.background_color) && {
      background: {
        ...(credentialDisplay.rendering?.simple?.background_image && {
          image: {
            ...(credentialDisplay.rendering.simple.background_image.uri && {
              uri: credentialDisplay.rendering.simple.background_image.uri,
            }),
            ...(credentialDisplay.rendering.simple.background_image.alt_text && {
              alt: credentialDisplay.rendering.simple.background_image.alt_text,
            }),
          },
        }),
        ...(credentialDisplay.rendering?.simple?.background_color && {
          color: credentialDisplay.rendering.simple.background_color,
        }),
      },
    }),
  }
}

export const sdJwtCombineDisplayLocalesFrom = async (args: SdJwtCombineDisplayLocalesFromArgs): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const { credentialDisplayLocales = new Map<string, SdJwtTypeDisplayMetadata>(), claimsMetadata = new Map<string, Array<IBasicCredentialClaim>>() } =
    args

  const locales: Array<string> = Array.from(new Set([...claimsMetadata.keys(), ...credentialDisplayLocales.keys()]))

  // See oid4vciCombineDisplayLocalesFrom for the rationale. Resolution order: exact → language-prefix →
  // no-locale (default) → first available, so every combined record (including the no-locale record a
  // wallet falls back to when its locale isn't advertised) carries the best available branding/claims.
  const resolveByLocale = <V>(map: Map<string, V>, locale: string): V | undefined => {
    const exact = map.get(locale)
    if (exact !== undefined) return exact
    if (locale) {
      const lang = locale.split('-')[0]
      for (const [key, value] of map) {
        if (key && key.split('-')[0] === lang) {
          return value
        }
      }
    }
    const noLocale = map.get('')
    if (noLocale !== undefined) return noLocale
    return map.values().next().value
  }

  return Promise.all(
    locales.map(async (locale: string): Promise<IBasicCredentialLocaleBranding> => {
      const display = resolveByLocale(credentialDisplayLocales, locale)
      const claims = resolveByLocale(claimsMetadata, locale)

      const branding: IBasicCredentialLocaleBranding = {
        ...(display && (await sdJwtCredentialLocaleBrandingFrom({ credentialDisplay: display }))),
        claims,
      }
      if (locale.length > 0) {
        branding.locale = locale
      } else {
        delete branding.locale
      }
      return branding
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
        ...((issuerDisplay.logo?.uri || <string>issuerDisplay.logo?.uri) && {
          uri: issuerDisplay.logo?.uri ?? <string>issuerDisplay.logo?.uri,
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
