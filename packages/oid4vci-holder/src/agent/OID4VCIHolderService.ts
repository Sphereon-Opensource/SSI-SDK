import {
  CredentialConfigurationSupported,
  CredentialOfferFormat,
  CredentialOfferPayloadV1_0_11,
  CredentialResponse,
  CredentialsSupportedDisplay,
  OpenId4VCIVersion,
} from '@sphereon/oid4vci-common'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialMapper,
  IVerifiableCredential,
  IVerifyResult,
  OriginalVerifiableCredential,
  W3CVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { IDIDManager, IIdentifier, IKey, IResolver, IVerifyCredentialArgs, TAgent, TKeyType, VerifiableCredential } from '@veramo/core'
import { translate } from '../localization/Localization'
import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { _ExtendedIKey } from '@veramo/utils'
import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { createJWT, Signer } from 'did-jwt'
import { credentialLocaleBrandingFrom } from './OIDC4VCIBrandingMapper'
import {
  CreateIdentifierArgs,
  GetAuthenticationKeyArgs,
  GetCredentialBrandingArgs,
  GetCredentialsSupportedArgs,
  GetDefaultIssuanceOptsArgs,
  GetIdentifierArgs,
  GetIssuanceCryptoSuiteArgs,
  GetIssuanceDidMethodArgs,
  GetIssuanceOptsArgs,
  GetOrCreatePrimaryIdentifierArgs,
  GetPreferredCredentialFormatsArgs,
  GetSignerArgs,
  GetSupportedCredentialsArgs,
  IdentifierAliasEnum,
  IdentifierOpts,
  IssuanceOpts,
  KeyManagementSystemEnum,
  KeyTypeFromCryptographicSuiteArgs,
  MapCredentialToAcceptArgs,
  MappedCredentialToAccept,
  OID4VCIHolderEvent,
  RequiredContext,
  SelectAppLocaleBrandingArgs,
  SignatureAlgorithmEnum,
  SignatureAlgorithmFromKeyArgs,
  SignatureAlgorithmFromKeyTypeArgs,
  SignJwtArgs,
  SupportedDidMethodEnum,
  VerificationResult,
  VerificationSubResult,
  VerifyCredentialToAcceptArgs,
} from '../types/IOID4VCIHolder'

export const DID_PREFIX = 'did'

export const getSupportedCredentials = async (args: GetSupportedCredentialsArgs): Promise<Record<string, CredentialConfigurationSupported>> => {
  const { openID4VCIClient } = args
  //const { openID4VCIClient, vcFormatPreferences } = args

  if (!openID4VCIClient.credentialOffer) {
    return Promise.reject(Error('openID4VCIClient has no credentialOffer'))
  }

  // todo: remove format here. This is just a temp hack for V11+ issuance of only one credential. Having a single array with formats for multiple credentials will not work. This should be handled in VCI itself
  /* FIXME support older versions again
  if (openID4VCIClient.version() > OpenId4VCIVersion.VER_1_0_09  && openID4VCIClient.version() < OpenId4VCIVersion.VER_1_0_13
      && typeof openID4VCIClient.credentialOffer.credential_offer === 'object') {
    let format: string[] | undefined = undefined
    const credentialOffer = openID4VCIClient.credentialOffer.credential_offer as CredentialOfferPayloadV1_0_11
    format = credentialOffer.credentials
      .filter((format: string | CredentialOfferFormat): boolean => typeof format !== 'string')
      .map((format: string | CredentialOfferFormat) => (format as CredentialOfferFormat).format)
    if (format?.length === 0) {
      format = undefined // Otherwise we would match nothing
    }
    const credentialsSupported: Record<string, CredentialConfigurationSupported> = openID4VCIClient.getCredentialsSupported(true, format)
    return getPreferredCredentialFormats({ credentials: credentialsSupported, vcFormatPreferences })
  }
*/
  if (openID4VCIClient.version() > OpenId4VCIVersion.VER_1_0_12) {
    return openID4VCIClient.getCredentialsSupported() as Record<string, CredentialConfigurationSupported>
  }
  throw new Error('FIXME') // FIXME
}

export const getCredentialBranding = async (args: GetCredentialBrandingArgs): Promise<Record<string, Array<IBasicCredentialLocaleBranding>>> => {
  const { credentialsSupported, context } = args
  const credentialBranding: Record<string, Array<IBasicCredentialLocaleBranding>> = {}
  await Promise.all(
    Object.values(credentialsSupported).map(async (credential: CredentialConfigurationSupported): Promise<void> => {
      const localeBranding: Array<IBasicCredentialLocaleBranding> = await Promise.all(
        (credential.display ?? []).map(
          async (display: CredentialsSupportedDisplay): Promise<IBasicCredentialLocaleBranding> =>
            await context.agent.ibCredentialLocaleBrandingFrom({ localeBranding: await credentialLocaleBrandingFrom(display) }),
        ),
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

      credentialBranding[credentialTypes[0]] = localeBranding // TODO for now taking the first type
    }),
  )

  return credentialBranding
}

export const getPreferredCredentialFormats = async (
  args: GetPreferredCredentialFormatsArgs,
): Promise<Record<string, CredentialConfigurationSupported>> => {
  return Object.entries(args.credentials)
    .filter(([_, config]) => config.format in args.vcFormatPreferences)
    .reduce(
      (acc, [key, config]) => {
        acc[key] = config
        return acc
      },
      {} as Record<string, CredentialConfigurationSupported>,
    )
}

export const selectCredentialLocaleBranding = (
  args: SelectAppLocaleBrandingArgs,
): Promise<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding | undefined> => {
  const { locale, localeBranding } = args

  const branding = localeBranding?.find(
    (branding: IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding) =>
      locale ? branding.locale?.startsWith(locale) || branding.locale === undefined : branding.locale === undefined, // TODO refactor as we have duplicate code
  )

  // FIXME as we should be able to just return the value directly
  return Promise.resolve(branding)
}

export const verifyCredentialToAccept = async (args: VerifyCredentialToAcceptArgs): Promise<void> => {
  const { mappedCredential, context } = args

  const credential = mappedCredential.credential.credentialResponse.credential as OriginalVerifiableCredential
  const wrappedVC = CredentialMapper.toWrappedVerifiableCredential(credential)
  if (
    wrappedVC.decoded?.iss?.includes('did:ebsi:') ||
    (typeof wrappedVC.decoded?.vc?.issuer === 'string'
      ? wrappedVC.decoded?.vc?.issuer?.includes('did:ebsi:')
      : wrappedVC.decoded?.vc?.issuer?.existingInstanceId?.includes('did:ebsi:'))
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
    context,
  )

  if (!verificationResult.result || verificationResult.error) {
    return Promise.reject(
      Error(verificationResult.result ? verificationResult.error : translate('oid4vci_machine_credential_verification_failed_message')),
    )
  }
}

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

export const mapCredentialToAccept = async (args: MapCredentialToAcceptArgs): Promise<MappedCredentialToAccept> => {
  const { credential } = args

  const credentialResponse: CredentialResponse = credential.credentialResponse
  const verifiableCredential: W3CVerifiableCredential | undefined = credentialResponse.credential
  const wrappedVerifiableCredential: WrappedVerifiableCredential = CredentialMapper.toWrappedVerifiableCredential(
    verifiableCredential as OriginalVerifiableCredential,
  )

  if (wrappedVerifiableCredential?.credential?.compactSdJwtVc) {
    return Promise.reject(Error('SD-JWT not supported yet'))
  }

  const uniformVerifiableCredential: IVerifiableCredential = <IVerifiableCredential>wrappedVerifiableCredential.credential
  const rawVerifiableCredential: VerifiableCredential = credentialResponse.credential as unknown as VerifiableCredential
  const correlationId: string =
    typeof uniformVerifiableCredential.issuer === 'string' ? uniformVerifiableCredential.issuer : uniformVerifiableCredential.issuer.id

  return {
    correlationId,
    credential,
    rawVerifiableCredential,
    uniformVerifiableCredential,
  }
}

export const getDefaultIssuanceOpts = async (args: GetDefaultIssuanceOptsArgs): Promise<IssuanceOpts> => {
  //const { credentialSupported, opts, context } = args
  const { credentialSupported, context } = args

  const issuanceOpt = {
    ...credentialSupported,
    didMethod: SupportedDidMethodEnum.DID_JWK,
    //didMethod: opts.client.isEBSI() ? SupportedDidMethodEnum.DID_KEY : SupportedDidMethodEnum.DID_JWK, FIXME
    keyType: 'Secp256r1',
  } as IssuanceOpts
  const identifierOpts = await getIdentifier({ issuanceOpt, context })

  return {
    ...issuanceOpt,
    ...identifierOpts,
  }
}

export const getIdentifier = async (args: GetIdentifierArgs): Promise<IdentifierOpts> => {
  const { issuanceOpt, context } = args

  const identifier =
    issuanceOpt.identifier ??
    (await getOrCreatePrimaryIdentifier({
      context,
      opts: {
        method: issuanceOpt.didMethod,
        createOpts: { options: { type: issuanceOpt.keyType, use: KeyUse.Signature, codecName: issuanceOpt.codecName } },
      },
    }))
  const key: _ExtendedIKey = await getAuthenticationKey({ identifier, context })
  const kid: string = key.meta.verificationMethod.id

  return { identifier, key, kid }
}

export const getAuthenticationKey = async (args: GetAuthenticationKeyArgs): Promise<_ExtendedIKey> => {
  const { identifier, context } = args
  const agentContext = { ...context, agent: context.agent as TAgent<IResolver & IDIDManager> }

  return (
    (await getFirstKeyWithRelation(identifier, agentContext, 'authentication', false)) ||
    ((await getFirstKeyWithRelation(identifier, agentContext, 'verificationMethod', true)) as _ExtendedIKey)
  )
}

export const getOrCreatePrimaryIdentifier = async (args: GetOrCreatePrimaryIdentifierArgs): Promise<IIdentifier> => {
  const { context, opts } = args

  const identifiers = (await context.agent.didManagerFind(opts?.method ? { provider: `${DID_PREFIX}:${opts?.method}` } : {})).filter(
    (identifier: IIdentifier) =>
      opts?.createOpts?.options?.type === undefined || identifier.keys.some((key: IKey) => key.type === opts?.createOpts?.options?.type),
  )

  if (opts?.method === SupportedDidMethodEnum.DID_KEY) {
    const createOpts = opts?.createOpts ?? {}
    createOpts.options = { codecName: 'EBSI', type: 'Secp256r1', ...createOpts }
    opts.createOpts = createOpts
  }
  const identifier: IIdentifier = !identifiers || identifiers.length == 0 ? await createIdentifier({ context, opts }) : identifiers[0]

  return await context.agent.didManagerGet({ did: identifier.did })
}

export const createIdentifier = async (args: CreateIdentifierArgs): Promise<IIdentifier> => {
  const { context, opts } = args

  const identifier = await context.agent.didManagerCreate({
    kms: opts?.createOpts?.kms ?? KeyManagementSystemEnum.LOCAL,
    ...(opts?.method && { provider: `${DID_PREFIX}:${opts?.method}` }),
    alias: opts?.createOpts?.alias ?? `${IdentifierAliasEnum.PRIMARY}-${opts?.method}-${opts?.createOpts?.options?.type}-${new Date().toUTCString()}`,
    options: opts?.createOpts?.options,
  })

  await context.agent.emit(OID4VCIHolderEvent.IDENTIFIER_CREATED, { identifier })

  return identifier
}

export const getCredentialsSupported = async (args: GetCredentialsSupportedArgs): Promise<Record<string, CredentialConfigurationSupported>> => {
  const { client, vcFormatPreferences } = args
  // todo: remove format here. This is just a temp hack for V11+ issuance of only one credential. Having a single array with formats for multiple credentials will not work. This should be handled in VCI itself
  let format: string[] | undefined = undefined
  if (
    client.version() > OpenId4VCIVersion.VER_1_0_09 &&
    client.version() < OpenId4VCIVersion.VER_1_0_13 &&
    typeof client.credentialOffer?.credential_offer === 'object'
  ) {
    const credentialOffer = client.credentialOffer.credential_offer as CredentialOfferPayloadV1_0_11
    format = credentialOffer.credentials
      .filter((format: string | CredentialOfferFormat): boolean => typeof format !== 'string')
      .map((format: string | CredentialOfferFormat) => (format as CredentialOfferFormat).format)
    if (format.length === 0) {
      format = undefined // Otherwise we would match nothing
    }
  }

  // This restricts to initiation types when there is an offer
  const supportedCredentials = client.getCredentialsSupported() as Record<string, CredentialConfigurationSupported>
  let credentialsSupported = await getPreferredCredentialFormats({ credentials: supportedCredentials, vcFormatPreferences })
  if (!credentialsSupported || Object.keys(credentialsSupported).length === 0) {
    credentialsSupported = client.getCredentialsSupported() as Record<string, CredentialConfigurationSupported>
    /*  FIXME we don't have credential_offer.credentials anymore in v13
    credentialsSupported =
      client.credentialOffer?.credential_offer.credentials
        .filter((format: string | CredentialOfferFormat): boolean => typeof format !== 'string')
        .map((credential: string | CredentialOfferFormat) => {
          return {
            format: (<CredentialOfferFormat>credential).format,
            // todo: Move this to VCI lib. A function to get the types from an offer format, including older versions of the spec
            types:
              (<CredentialOfferFormatJwtVcJsonLdAndLdpVc>credential).credential_definition?.types ??
              (<CredentialOfferFormatJwtVcJson>credential).types,
          } as CredentialSupported
        }) ?? [] // todo check if this addition is ok ?? []
*/
  }

  return credentialsSupported
}

export const getIssuanceOpts = async (args: GetIssuanceOptsArgs): Promise<Array<IssuanceOpts>> => {
  const {
    client,
    credentialsSupported,
    serverMetadata,
    context,
    didMethodPreferences,
    jwtCryptographicSuitePreferences,
    jsonldCryptographicSuitePreferences,
  } = args

  if (credentialsSupported === undefined || Object.keys(credentialsSupported).length === 0) {
    return Promise.reject(Error('No credentials supported'))
  }

  const getIssuanceOpts: Array<Promise<IssuanceOpts>> = Object.values(credentialsSupported).map(async (credentialSupported) => {
    if (!serverMetadata?.credentialIssuerMetadata) {
      return await getDefaultIssuanceOpts({ credentialSupported, opts: { client }, context })
    }

    const cryptographicSuite: string = await getIssuanceCryptoSuite({
      credentialSupported,
      client,
      jwtCryptographicSuitePreferences,
      jsonldCryptographicSuitePreferences,
    })
    const didMethod: SupportedDidMethodEnum = await getIssuanceDidMethod({
      credentialSupported,
      client,
      didMethodPreferences,
    })
    const issuanceOpt = {
      ...credentialSupported,
      didMethod,
      format: credentialSupported.format,
      //      keyType: client.isEBSI() ? 'Secp256r1' : keyTypeFromCryptographicSuite({ suite: cryptographicSuite }), FIXME
      keyType: keyTypeFromCryptographicSuite({ suite: cryptographicSuite }),
      //      ...(client.isEBSI() && { codecName: 'EBSI' }), FIXME
    } as IssuanceOpts
    const identifierOpts = await getIdentifier({ issuanceOpt, context })
    if (!client.clientId) {
      // FIXME: We really should fetch server metadata. Have user select required credentials. Take the first cred to determine a kid when no clientId is present and set that.
      //  Needs a preference service for crypto, keys, dids, and clientId, with ecosystem support
      client.clientId = identifierOpts.identifier.did
    }

    return { ...issuanceOpt, ...identifierOpts }
  })

  return await Promise.all(getIssuanceOpts)
}

export const getIssuanceDidMethod = async (opts: GetIssuanceDidMethodArgs): Promise<SupportedDidMethodEnum> => {
  const { credentialSupported, didMethodPreferences } = opts
  const { format, cryptographic_binding_methods_supported } = credentialSupported
  if (cryptographic_binding_methods_supported && Array.isArray(cryptographic_binding_methods_supported)) {
    const method: SupportedDidMethodEnum | undefined = didMethodPreferences.find((method: SupportedDidMethodEnum) =>
      cryptographic_binding_methods_supported.includes(`did:${method.toLowerCase().replace('did:', '')}`),
    )
    if (method) {
      return method
    } else if (cryptographic_binding_methods_supported.includes('did')) {
      return format ? didMethodPreferences[1] : didMethodPreferences[0]
    }
  }

  /*
  if (client.isEBSI()) { FIXME
    return SupportedDidMethodEnum.DID_KEY
  }
*/
  if (!format || (format.includes('jwt') && !format?.includes('jwt_vc_json_ld'))) {
    return format ? didMethodPreferences[1] : didMethodPreferences[0]
  } else {
    // JsonLD
    return didMethodPreferences[0]
  }
}

export const getIssuanceCryptoSuite = async (opts: GetIssuanceCryptoSuiteArgs): Promise<string> => {
  const { credentialSupported, jwtCryptographicSuitePreferences, jsonldCryptographicSuitePreferences } = opts
  const signing_algs_supported: Array<string> = credentialSupported.credential_signing_alg_values_supported ?? []

  // TODO: Return array, so the wallet/user could choose
  switch (credentialSupported.format) {
    // @ts-ignore
    case 'jwt':
    case 'jwt_vc_json':
    case 'jwt_vc': {
      const supportedPreferences: Array<SignatureAlgorithmEnum> = jwtCryptographicSuitePreferences.filter((suite: SignatureAlgorithmEnum) =>
        signing_algs_supported.includes(suite),
      )

      if (supportedPreferences.length > 0) {
        return supportedPreferences[0]
      } /*else if (client.isEBSI()) { FIXME
        return SignatureAlgorithmEnum.ES256
      }*/

      // if we cannot find supported cryptographic suites, we just try with the first preference
      const fallback = jwtCryptographicSuitePreferences[0]
      console.log(`Warn: We could not determine the crypto suites from the server metadata, and will fallback to a default: ${fallback}`)
      return fallback
    }
    // @ts-ignore
    case 'ldp':
    // @ts-ignore
    case 'jwt_vc_json_ld':
    case 'ldp_vc': {
      const supportedPreferences: Array<string> = jsonldCryptographicSuitePreferences.filter((suite: string) =>
        signing_algs_supported.includes(suite),
      )
      if (supportedPreferences.length > 0) {
        return supportedPreferences[0]
      }

      // if we cannot find supported cryptographic suites, we just try with the first preference
      const fallback = jsonldCryptographicSuitePreferences[0]
      console.log(`Warn: We could not determine the crypto suites from the server metadata, and will fallback to a default: ${fallback}`)
      return fallback
    }
    default:
      return Promise.reject(Error(`Credential format '${credentialSupported.format}' not supported`))
  }
}

export const signatureAlgorithmFromKey = async (args: SignatureAlgorithmFromKeyArgs): Promise<SignatureAlgorithmEnum> => {
  const { key } = args
  return signatureAlgorithmFromKeyType({ type: key.type })
}

export const signJWT = async (args: SignJwtArgs): Promise<string> => {
  const { identifier, header, payload, context, options } = args
  const jwtOptions = {
    ...options,
    signer: await getSigner({ identifier, context }),
  }

  return createJWT(payload, jwtOptions, header)
}

export const getSigner = async (args: GetSignerArgs): Promise<Signer> => {
  const { identifier, context } = args
  // TODO currently we assume an identifier only has one key
  const key = identifier.keys[0]
  // TODO See if this is mandatory for a correct JWT
  const algorithm = await signatureAlgorithmFromKey({ key })

  return async (data: string | Uint8Array): Promise<string> => {
    const input = data instanceof Object.getPrototypeOf(Uint8Array) ? new TextDecoder().decode(data as Uint8Array) : (data as string)
    return await context.agent.keyManagerSign({
      keyRef: key.kid,
      algorithm,
      data: input,
    })
  }
}

export const signatureAlgorithmFromKeyType = (args: SignatureAlgorithmFromKeyTypeArgs): SignatureAlgorithmEnum => {
  const { type } = args
  switch (type) {
    case 'Ed25519':
    case 'X25519':
      return SignatureAlgorithmEnum.EdDSA
    case 'Secp256r1':
      return SignatureAlgorithmEnum.ES256
    case 'Secp256k1':
      return SignatureAlgorithmEnum.ES256K
    default:
      throw new Error(`Key type '${type}' not supported`)
  }
}

// TODO improve this conversion for jwt and jsonld, not a fan of current structure
export const keyTypeFromCryptographicSuite = (args: KeyTypeFromCryptographicSuiteArgs): TKeyType => {
  const { suite } = args
  switch (suite) {
    case 'EdDSA':
    case 'Ed25519Signature2018':
    case 'Ed25519Signature2020':
    case 'JcsEd25519Signature2020':
      return 'Ed25519'
    case 'JsonWebSignature2020':
    case 'ES256':
      return 'Secp256r1'
    case 'EcdsaSecp256k1Signature2019':
    case 'ES256K':
      return 'Secp256k1'
    default:
      throw new Error(`Cryptographic suite '${suite}' not supported`)
  }
}
