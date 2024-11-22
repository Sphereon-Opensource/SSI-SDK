import { CredentialsSupportedDisplay, NameAndLocale } from '@sphereon/oid4vci-common'
import {
  IBasicCredentialClaim,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding
} from '@sphereon/ssi-sdk.data-store'
import {
  CredentialLocaleBrandingFromArgs,
  IssuerLocaleBrandingFromArgs,
  CredentialBrandingFromArgs,
  CredentialDisplayLocalesFromArgs,
  IssuerCredentialSubjectLocalesFromArgs,
  CombineLocalesFromArgs
} from '../types/IOID4VCIHolder'

// FIXME should we not move this to the branding plugin?
export const credentialLocaleBrandingFrom = async (args: CredentialLocaleBrandingFromArgs): Promise<IBasicCredentialLocaleBranding> => {
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

// TODO since dynamicRegistrationClientMetadata can also be on a RP, we should start using this mapper in a more general way
export const issuerLocaleBrandingFrom = async (args: IssuerLocaleBrandingFromArgs): Promise<IBasicIssuerLocaleBranding> => {
  const { issuerDisplay, dynamicRegistrationClientMetadata } = args

  return {
    ...(dynamicRegistrationClientMetadata?.client_name && {
      alias: dynamicRegistrationClientMetadata?.client_name
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
          uri: dynamicRegistrationClientMetadata?.logo_uri
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
      clientUri: dynamicRegistrationClientMetadata?.client_uri
    }),
    ...(dynamicRegistrationClientMetadata?.tos_uri && {
      tosUri: dynamicRegistrationClientMetadata?.tos_uri
    }),
    ...(dynamicRegistrationClientMetadata?.policy_uri && {
      policyUri: dynamicRegistrationClientMetadata?.policy_uri
    }),
    ...(dynamicRegistrationClientMetadata?.contacts && {
      contacts: dynamicRegistrationClientMetadata?.contacts
    }),
  }
}

export const getCredentialBrandingFrom = async (args: CredentialBrandingFromArgs): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const { credentialDisplay, issuerCredentialSubject } = args

  return combineDisplayLocalesFrom({
    ...(issuerCredentialSubject && { issuerCredentialSubjectLocales: await issuerCredentialSubjectLocalesFrom({ issuerCredentialSubject }) }),
    ...(credentialDisplay && { credentialDisplayLocales: await credentialDisplayLocalesFrom({ credentialDisplay }) }),
  })
}

const credentialDisplayLocalesFrom = async (args: CredentialDisplayLocalesFromArgs): Promise<Map<string, CredentialsSupportedDisplay>> => {
  const { credentialDisplay } = args
  return credentialDisplay.reduce((localeDisplays, display) => {
    const localeKey = display.locale || '';
    localeDisplays.set(localeKey, display);
    return localeDisplays;
  }, new Map<string, CredentialsSupportedDisplay>());
}

const issuerCredentialSubjectLocalesFrom = async (args: IssuerCredentialSubjectLocalesFromArgs): Promise<Map<string, Array<IBasicCredentialClaim>>> => {
  const { issuerCredentialSubject } = args
  const localeClaims = new Map<string, Array<IBasicCredentialClaim>>();

  const processClaimObject = (claim: any, parentKey: string = ''): void => {
    Object.entries(claim).forEach(([key, value]): void => {
      if (key === 'mandatory' || key === 'value_type') {
        return;
      }

      if (key === 'display' && Array.isArray(value)) {
        value.forEach(({ name, locale }: NameAndLocale): void => {
          if (!name) {
            return;
          }

          const localeKey = locale || '';
          if (!localeClaims.has(localeKey)) {
            localeClaims.set(localeKey, []);
          }
          localeClaims.get(localeKey)!.push({ key: parentKey, name });
        });
      } else if (typeof value === 'object' && value !== null) {
        processClaimObject(value, parentKey ? `${parentKey}.${key}` : key);
      }
    });
  };

  processClaimObject(issuerCredentialSubject);
  return localeClaims;
};

const combineDisplayLocalesFrom = async (args: CombineLocalesFromArgs): Promise<Array<IBasicCredentialLocaleBranding>> => {
  const {
    credentialDisplayLocales = new Map<string, CredentialsSupportedDisplay>(),
    issuerCredentialSubjectLocales = new Map<string, Array<IBasicCredentialClaim>>()
  } = args

  const locales: Array<string> = Array.from(new Set([
    ...issuerCredentialSubjectLocales.keys(),
    ...credentialDisplayLocales.keys()
  ]));

  return Promise.all(locales.map(async (locale: string): Promise<IBasicCredentialLocaleBranding> => {
    const display = credentialDisplayLocales.get(locale)
    const claims = issuerCredentialSubjectLocales.get(locale)

    return {
      ...(display && await credentialLocaleBrandingFrom({ credentialDisplay: display })),
      ...(locale.length > 0 && { locale }),
      claims
    }
  }))
}
