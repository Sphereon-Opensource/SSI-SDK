import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  CredentialOfferFormat,
  CredentialResponse,
  CredentialsSupportedDisplay,
  CredentialSupported,
  //EndpointMetadataResult,
  OpenId4VCIVersion,
} from '@sphereon/oid4vci-common'
import {
  CredentialToAccept,
  MappedCredentialToAccept,
  RequiredContext,
  SelectAppLocaleBrandingArgs,
  VerificationResult,
  VerificationSubResult,
  VerifyCredentialToAcceptArgs,
} from '../types/IOID4VCIHolder'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store'
import { credentialLocaleBrandingFrom } from './OIDC4VCIBrandingMapper'
import {
  CredentialMapper,
  IVerifiableCredential,
  IVerifyResult,
  OriginalVerifiableCredential,
  W3CVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { IVerifyCredentialArgs, VerifiableCredential } from '@veramo/core'
import { translate } from '../localization/Localization'

// TODO create arg object for all functions
// export const getServerMetadata = async (openID4VCIClient: OpenID4VCIClient): Promise<EndpointMetadataResult> => {
//   // @ts-ignore
//   return openID4VCIClient.retrieveServerMetadata();
// }

export const getSupportedCredentials = async (
  openID4VCIClient: OpenID4VCIClient,
  vcFormatPreferences: Array<string>
): Promise<Array<CredentialSupported>> => {
  // todo: remove format here. This is just a temp hack for V11+ issuance of only one credential. Having a single array with formats for multiple credentials will not work. This should be handled in VCI itself
  let format: string[] | undefined = undefined
  // @ts-ignore
  if (openID4VCIClient.version() > OpenId4VCIVersion.VER_1_0_09 && typeof openID4VCIClient.credentialOffer.credential_offer === 'object') {
    // @ts-ignore
    format = openID4VCIClient.credentialOffer.credential_offer.credentials
      // @ts-ignore
      .filter((format: string | CredentialOfferFormat): boolean => typeof format !== 'string')
      // @ts-ignore
      .map((format: string | CredentialOfferFormat) => (format as CredentialOfferFormat).format)
    if (format?.length === 0) {
      format = undefined // Otherwise we would match nothing
    }
  }

  // @ts-ignore
  return getPreferredCredentialFormats(openID4VCIClient.getCredentialsSupported(true, format), vcFormatPreferences)
}

export const getCredentialBranding = async (
  supportedCredentials: Array<CredentialSupported>,
  context: RequiredContext
): Promise<Map<string, Array<IBasicCredentialLocaleBranding>>> => {
  const credentialBranding = new Map<string, Array<IBasicCredentialLocaleBranding>>()
  await Promise.all(
    supportedCredentials.map(async (credential: CredentialSupported): Promise<void> => {
      const localeBranding: Array<IBasicCredentialLocaleBranding> = await Promise.all(
        (credential.display ?? []).map(
          async (display: CredentialsSupportedDisplay): Promise<IBasicCredentialLocaleBranding> =>
            await context.agent.ibCredentialLocaleBrandingFrom({ localeBranding: await credentialLocaleBrandingFrom(display) })
        )
      )

      const defaultCredentialType = 'VerifiableCredential'
      const credentialTypes: Array<string> =
        // @ts-ignore
        credential.types.length > 1
          ? // @ts-ignore
            credential.types.filter((type: string): boolean => type !== defaultCredentialType)
          : // @ts-ignore
          credential.types.length === 0
          ? [defaultCredentialType]
          : // @ts-ignore
            credential.types

      credentialBranding.set(credentialTypes[0], localeBranding) // TODO for now taking the first type
    })
  )

  return credentialBranding
}

export const getPreferredCredentialFormats = async (
  credentials: Array<CredentialSupported>,
  vcFormatPreferences: Array<string>
): Promise<Array<CredentialSupported>> => {
  // Group credentials based on types as we now have multiple entries for one vc with different formats

  const groupedTypes: Array<any> = Array.from(
    // TODO any
    credentials
      .reduce(
        // @ts-ignore // TODO sd jwts type issue
        (map: Map<any, any>, value: CredentialSupported) => map.set(value.types.toString(), [...(map.get(value.types.toString()) || []), value]),
        new Map()
      )
      .values()
  )

  const preferredCredentials: Array<CredentialSupported> = []

  for (const group of groupedTypes) {
    for (const vcFormatPreference of vcFormatPreferences) {
      const credentialSupported = group.find((credentialSupported: CredentialSupported): boolean => credentialSupported.format === vcFormatPreference)
      if (credentialSupported) {
        preferredCredentials.push(credentialSupported)
        break
      }
    }
  }

  return preferredCredentials
}

export const selectCredentialLocaleBranding = (
  args: SelectAppLocaleBrandingArgs
): Promise<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding | undefined> => {
  const { locale, localeBranding } = args

  // @ts-ignore
  return localeBranding?.find(
    (branding: IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding) =>
      locale ? branding.locale?.startsWith(locale) || branding.locale === undefined : branding.locale === undefined // TODO refactor as we duplicate code
  )
}

export const verifyCredentialToAccept = async (args: VerifyCredentialToAcceptArgs): Promise<void> => {
  const { mappedCredential, context } = args

  const credential = mappedCredential.credential.credentialResponse.credential as OriginalVerifiableCredential
  const wrappedVC = CredentialMapper.toWrappedVerifiableCredential(credential)
  if (
    wrappedVC.decoded?.iss?.includes('did:ebsi:') ||
    (typeof wrappedVC.decoded?.vc?.issuer === 'string'
      ? wrappedVC.decoded?.vc?.issuer?.includes('did:ebsi:')
      : wrappedVC.decoded?.vc?.issuer?.id?.includes('did:ebsi:'))
  ) {
    // TODO: Skipping VC validation for EBSI conformance issued credential, as their Issuer is not present in the ledger (sigh)
    if (JSON.stringify(wrappedVC.decoded).includes('vc:ebsi:conformance')) {
      return
    }
  }

  const verificationResult: VerificationResult = await verifyCredential(
    {
      credential: credential as VerifiableCredential,
      // TODO WAL-675 we might want to allow these types of options as part of the context, now we have state machines. Allows us to pre-determine whether these policies apply and whether remote context should be fetched
      fetchRemoteContexts: true,
      policies: {
        credentialStatus: false,
        expirationDate: false,
        issuanceDate: false,
      },
    },
    context
  )

  if (!verificationResult.result || verificationResult.error) {
    return Promise.reject(
      Error(verificationResult.result ? verificationResult.error : translate('oid4vci_machine_credential_verification_failed_message'))
    )
  }
}

// TODO, refactor
export const verifyCredential = async (args: IVerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult> => {
  // We also allow/add boolean, because 4.x Veramo returns a boolean for JWTs. 5.X will return better results
  const result: IVerifyResult | boolean = (await context.agent.verifyCredential(args)) as IVerifyResult | boolean

  if (typeof result === 'boolean') {
    return {
      source: CredentialMapper.toWrappedVerifiableCredential(args.credential as OriginalVerifiableCredential),
      result,
      ...(!result && {
        error: 'Invalid JWT VC',
        errorDetails: `JWT VC could was not valid with policies: ${JSON.stringify(args.policies)}`,
      }),
      subResults: [],
    }
  } else {
    const subResults: Array<VerificationSubResult> = []
    let error: string | undefined
    let errorDetails: string | undefined
    if (result.error) {
      error = result.error?.message ?? ''
      errorDetails = result.error?.details?.code ?? ''
      errorDetails = (errorDetails !== '' ? `${errorDetails}, ` : '') + (result.error?.details?.url ?? '')
      if (result.error?.errors) {
        error = (error !== '' ? `${error}, ` : '') + result.error?.errors?.map((error) => error.message ?? error.name).join(', ')
        errorDetails =
          (errorDetails !== '' ? `${errorDetails}, ` : '') +
          result.error?.errors?.map((error) => (error?.details?.code ? `${error.details.code}, ` : '') + (error?.details?.url ?? '')).join(', ')
      }
    }

    return {
      source: CredentialMapper.toWrappedVerifiableCredential(args.credential as OriginalVerifiableCredential),
      result: result.verified,
      subResults,
      error,
      errorDetails,
    }
  }
}

// TODO args object
export const mapCredentialToAccept = async (credentials: Array<CredentialToAccept>): Promise<Array<MappedCredentialToAccept>> => {
  return credentials.map((credential: CredentialToAccept): MappedCredentialToAccept => {
    const credentialResponse: CredentialResponse = credential.credentialResponse
    const verifiableCredential: W3CVerifiableCredential | undefined = credentialResponse.credential
    const wrappedVerifiableCredential: WrappedVerifiableCredential = CredentialMapper.toWrappedVerifiableCredential(
      verifiableCredential as OriginalVerifiableCredential
    )
    if (wrappedVerifiableCredential?.credential?.compactSdJwtVc) {
      throw Error('SD-JWT not supported yet')
    }
    const uniformVerifiableCredential: IVerifiableCredential = <IVerifiableCredential>wrappedVerifiableCredential.credential
    const rawVerifiableCredential: VerifiableCredential = credentialResponse.credential as unknown as VerifiableCredential

    const correlationId: string =
      typeof uniformVerifiableCredential.issuer === 'string' ? uniformVerifiableCredential.issuer : uniformVerifiableCredential.issuer.id

    return {
      correlationId,
      credential: credential,
      rawVerifiableCredential,
      uniformVerifiableCredential,
    }
  })
}
