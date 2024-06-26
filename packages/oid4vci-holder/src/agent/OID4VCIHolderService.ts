import { LOG } from '@sphereon/oid4vci-client'
import {
  CredentialConfigurationSupported,
  CredentialOfferFormat,
  CredentialResponse,
  CredentialsSupportedDisplay,
  getTypesFromObject,
  OpenId4VCIVersion,
} from '@sphereon/oid4vci-common'
import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialMapper,
  IVerifiableCredential,
  IVerifyResult,
  OriginalVerifiableCredential,
  sdJwtDecodedCredentialToUniformCredential,
  SdJwtDecodedVerifiableCredential,
  W3CVerifiableCredential,
  WrappedVerifiableCredential
} from '@sphereon/ssi-types'
import {
  IDIDManager,
  IIdentifier,
  IKey,
  IResolver,
  IVerifyCredentialArgs,
  TAgent,
  TKeyType,
  W3CVerifiableCredential as VeramoW3CVerifiableCredential
} from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { createJWT, Signer } from 'did-jwt'
import { translate } from '../localization/Localization'
import {
  CreateIdentifierArgs,
  CredentialVerificationError,
  GetAuthenticationKeyArgs,
  GetCredentialBrandingArgs,
  GetCredentialConfigsSupportedArgs,
  GetDefaultIssuanceOptsArgs,
  GetIdentifierArgs,
  GetIssuanceCryptoSuiteArgs,
  GetIssuanceDidMethodArgs,
  GetIssuanceOptsArgs,
  GetOrCreatePrimaryIdentifierArgs,
  GetPreferredCredentialFormatsArgs,
  GetSignerArgs,
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
  VerifyCredentialArgs,
  VerifyCredentialToAcceptArgs,
  VerifySDJWTCredentialArgs
} from '../types/IOID4VCIHolder'
import { credentialLocaleBrandingFrom } from './OIDC4VCIBrandingMapper'

export const DID_PREFIX = 'did'

export const getCredentialBranding = async (args: GetCredentialBrandingArgs): Promise<Record<string, Array<IBasicCredentialLocaleBranding>>> => {
  const { credentialsSupported, context } = args
  const credentialBranding: Record<string, Array<IBasicCredentialLocaleBranding>> = {}
  await Promise.all(
    Object.entries(credentialsSupported).map(async ([configId, credentialsConfigSupported]) => {
      const localeBranding: Array<IBasicCredentialLocaleBranding> = await Promise.all(
        (credentialsConfigSupported.display ?? []).map(
          async (display: CredentialsSupportedDisplay): Promise<IBasicCredentialLocaleBranding> =>
            await context.agent.ibCredentialLocaleBrandingFrom({ localeBranding: await credentialLocaleBrandingFrom(display) }),
        ),
      )

      const defaultCredentialType = 'VerifiableCredential'
      const credentialTypes: Array<string> = ('types' in credentialsConfigSupported // TODO credentialsConfigSupported.types is deprecated
        ? (credentialsConfigSupported.types as string[])
        : 'credential_definition' in credentialsConfigSupported
          ? credentialsConfigSupported.credential_definition.type
          : [defaultCredentialType]) ?? [configId]

      const filteredCredentialTypes = credentialTypes.filter((type: string): boolean => type !== defaultCredentialType)
      credentialBranding[filteredCredentialTypes[0]] = localeBranding // TODO for now taking the first type
    }),
  )

  return credentialBranding
}

export const getCredentialConfigsBasedOnFormatPref = async (
  args: GetPreferredCredentialFormatsArgs,
): Promise<Record<string, CredentialConfigurationSupported>> => {
  const { vcFormatPreferences, credentials } = args
  const prefConfigs = {} as Record<string, CredentialConfigurationSupported>
  Object.entries(credentials).forEach(([key, config]) => {
    const result = !config.format || vcFormatPreferences.map((pref) => pref.toLowerCase()).includes(config.format.toLowerCase())
    if (result) {
      prefConfigs[key] = config
    }
  })

  return prefConfigs
}

export const selectCredentialLocaleBranding = (args: SelectAppLocaleBrandingArgs): Promise<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding | undefined> => {
  const { locale, localeBranding } = args

  const branding = localeBranding?.find(
    (branding: IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding) =>
      locale ? branding.locale?.startsWith(locale) || branding.locale === undefined : branding.locale === undefined, // TODO refactor as we have duplicate code
  )

  // FIXME as we should be able to just return the value directly
  return Promise.resolve(branding)
}

export const verifyCredentialToAccept = async (args: VerifyCredentialToAcceptArgs): Promise<void> => {
  const { mappedCredential, hasher, context } = args

  const credential = mappedCredential.credentialToAccept.credentialResponse.credential as OriginalVerifiableCredential
  if (!credential) {
    return Promise.reject(Error('No credential found in credential response'))
  }

  const wrappedVC = CredentialMapper.toWrappedVerifiableCredential(credential, { hasher })
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
      credential,
      hasher,
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

export const verifyCredential = async (args: VerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult> => {
  const { credential, hasher } = args

  return (CredentialMapper.isSdJwtEncoded(credential))
    ? await verifySDJWTCredential({ credential, hasher }, context)
    : await verifyW3CCredential({ ...args, credential: credential as VeramoW3CVerifiableCredential }, context)
}

export const verifyW3CCredential = async (args: IVerifyCredentialArgs, context: RequiredContext): Promise<VerificationResult> => {
  const { credential, policies } = args

  const result: IVerifyResult | boolean = (await context.agent.verifyCredential(args))

  if (typeof result === 'boolean') {
    return {
      // FIXME the source is never used, need to start using this as the source of truth
      source: CredentialMapper.toWrappedVerifiableCredential(credential as OriginalVerifiableCredential),
      result,
      subResults: [],
      ...(!result && {
        error: 'Invalid JWT VC',
        errorDetails: `JWT VC was not valid with policies: ${JSON.stringify(policies)}`
      })
    }
  } else {
    //TODO look at what this is doing and make it simple and readable
    let error: string | undefined
    let errorDetails: string | undefined
    const subResults: Array<VerificationSubResult> = []
    if (result.error) {
      error = result.error?.message ?? ''
      errorDetails = result.error?.details?.code ?? ''
      errorDetails = (errorDetails !== '' ? `${errorDetails}, ` : '') + (result.error?.details?.url ?? '')
      if (result.error?.errors) {
        error = (error !== '' ? `${error}, ` : '') + result.error?.errors?.map((error: any) => error.message ?? error.name).join(', ')
        errorDetails =
          (errorDetails !== '' ? `${errorDetails}, ` : '') +
          result.error?.errors?.map((error: any) => (error?.details?.code ? `${error.details.code}, ` : '') + (error?.details?.url ?? '')).join(', ')
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

export const verifySDJWTCredential = async (args: VerifySDJWTCredentialArgs, context: RequiredContext): Promise<VerificationResult> => {
  const { credential, hasher } = args

  const result = await context.agent.verifySdJwtVc({ credential })
  .catch((error: Error): CredentialVerificationError => {
    return {
      error: 'Invalid SD-JWT VC',
      errorDetails: error.message ?? 'SD-JWT VC could not be verified',
    }
  })

  return {
    source: CredentialMapper.toWrappedVerifiableCredential(credential as OriginalVerifiableCredential, { hasher }),
    result: !!result.verifiedPayloads,
    subResults: [],
    ...(!result.verifiedPayloads && { ...result }),
  }
}

export const mapCredentialToAccept = async (args: MapCredentialToAcceptArgs): Promise<MappedCredentialToAccept> => {
  const { credentialToAccept, hasher } = args

  const credentialResponse: CredentialResponse = credentialToAccept.credentialResponse

  const verifiableCredential: W3CVerifiableCredential | undefined = credentialResponse.credential
  if (!verifiableCredential) {
    return Promise.reject(Error('No credential found in credential response'))
  }

  const wrappedVerifiableCredential: WrappedVerifiableCredential = await CredentialMapper.toWrappedVerifiableCredential(verifiableCredential as OriginalVerifiableCredential, { hasher })
  const uniformVerifiableCredential: IVerifiableCredential = CredentialMapper.isSdJwtDecodedCredential(wrappedVerifiableCredential.credential)
      ? await sdJwtDecodedCredentialToUniformCredential(<SdJwtDecodedVerifiableCredential>wrappedVerifiableCredential.credential)
      : <IVerifiableCredential>wrappedVerifiableCredential.credential

  const correlationId: string = typeof uniformVerifiableCredential.issuer === 'string'
    ? uniformVerifiableCredential.issuer
    : CredentialMapper.isSdJwtDecodedCredential(uniformVerifiableCredential) ? uniformVerifiableCredential.decodedPayload.iss : uniformVerifiableCredential.issuer.id

  return {
    correlationId,
    credentialToAccept,
    rawVerifiableCredential: verifiableCredential,
    uniformVerifiableCredential,
    ...(credentialResponse.credential_subject_issuance && { credential_subject_issuance: credentialResponse.credential_subject_issuance }),
  }
}

export const getDefaultIssuanceOpts = async (args: GetDefaultIssuanceOptsArgs): Promise<IssuanceOpts> => {
  const { credentialSupported, opts, context } = args

  const issuanceOpt = {
    ...credentialSupported,
    didMethod: opts.client.isEBSI() ? SupportedDidMethodEnum.DID_KEY : SupportedDidMethodEnum.DID_JWK,
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
        createOpts: {
          options: {
            type: issuanceOpt.keyType,
            use: KeyUse.Signature,
            codecName: issuanceOpt.codecName,
          },
        },
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
  const identifier: IIdentifier =
    !identifiers || identifiers.length == 0
      ? await createIdentifier({
          context,
          opts,
        })
      : identifiers[0]

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

export const getCredentialConfigsSupported = async (
  args: GetCredentialConfigsSupportedArgs,
): Promise<Record<string, CredentialConfigurationSupported>> => {
  const { client, vcFormatPreferences } = args

  if (!client.credentialOffer) {
    return Promise.reject(Error('openID4VCIClient has no credentialOffer'))
  }

  // todo: remove format here. This is just a temp hack for V11+ issuance of only one credential. Having a single array with formats for multiple credentials will not work. This should be handled in VCI itself
  let format: string[] | undefined = undefined
  if (
    client.version() > OpenId4VCIVersion.VER_1_0_09 &&
    typeof client.credentialOffer.credential_offer === 'object' &&
    'credentials' in client.credentialOffer.credential_offer
  ) {
    format = client.credentialOffer.credential_offer.credentials
      .filter((format: string | CredentialOfferFormat): boolean => typeof format !== 'string')
      .map((format: string | CredentialOfferFormat) => (format as CredentialOfferFormat).format)
    if (format?.length === 0) {
      format = undefined // Otherwise we would match nothing
    }
  }

  const offerSupported = client.getCredentialsSupported(true, format)
  let allSupported: Record<string, CredentialConfigurationSupported>
  if (!Array.isArray(offerSupported)) {
    allSupported = offerSupported
  } else {
    allSupported = {} satisfies Record<string, CredentialConfigurationSupported>
    offerSupported.forEach((supported) => {
      if (supported.id) {
        allSupported[supported.id] = supported
        return
      }
      const format = supported.format
      const type: string = getTypesFromObject(supported)?.join() ?? ''
      const id = `${type}:${format}`
      allSupported[id] = supported
    })
  }

  let credentialConfigsSupported = await getCredentialConfigsBasedOnFormatPref({
    credentials: allSupported,
    vcFormatPreferences,
  })
  if (!credentialConfigsSupported || Object.keys(credentialConfigsSupported).length === 0) {
    LOG.warning(`No matching supported credential found for ${client.getIssuer()}`)
  }

  if (client.credentialOffer === undefined) {
    return credentialConfigsSupported
  }
  // Filter configurations based on the credential offer IDs
  const credentialOffer = client.credentialOffer.credential_offer

  let credentialsToOffer: Record<string, CredentialConfigurationSupported>
  if ('credential_configuration_ids' in credentialOffer) {
    credentialsToOffer = Object.fromEntries(
      Object.entries(credentialConfigsSupported).filter(([key]) => credentialOffer.credential_configuration_ids.includes(key)),
    )
    if (Object.keys(credentialsToOffer).length === 0) {
      throw new Error(`No matching supported credential configs found for offer ${credentialOffer.credential_configuration_ids.join(', ')}`)
    }
  } else {
    credentialsToOffer = credentialConfigsSupported
  }
  if (Object.keys(credentialsToOffer).length === 0) {
    // Same check as above, but more generic error message, as it can also apply to below draft 13
    throw new Error(`No matching supported credential configs found for offer`)
  }

  return credentialsToOffer
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
      keyType: client.isEBSI() ? 'Secp256r1' : keyTypeFromCryptographicSuite({ suite: cryptographicSuite }),
      ...(client.isEBSI() && { codecName: 'EBSI' }),
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
  const { client, credentialSupported, didMethodPreferences } = opts
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

  if (client.isEBSI()) {
    return SupportedDidMethodEnum.DID_KEY
  }

  if (!format || (format.includes('jwt') && !format?.includes('jwt_vc_json_ld'))) {
    return format ? didMethodPreferences[1] : didMethodPreferences[0]
  } else {
    // JsonLD
    return didMethodPreferences[0]
  }
}

export const getIssuanceCryptoSuite = async (opts: GetIssuanceCryptoSuiteArgs): Promise<string> => {
  const { client, credentialSupported, jwtCryptographicSuitePreferences, jsonldCryptographicSuitePreferences } = opts
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
      } else if (client.isEBSI()) {
        return SignatureAlgorithmEnum.ES256
      }

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
