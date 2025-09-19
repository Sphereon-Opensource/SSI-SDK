import { LOG } from '@sphereon/oid4vci-client'
import {
  AuthorizationChallengeCodeResponse,
  CredentialConfigurationSupported,
  CredentialConfigurationSupportedSdJwtVcV1_0_15,
  CredentialResponse,
  CredentialResponseV1_0_15,
  CredentialSupportedSdJwtVc,
  getSupportedCredentials,
  getTypesFromCredentialSupported,
  getTypesFromObject,
  MetadataDisplay,
} from '@sphereon/oid4vci-common'
import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { getOrCreatePrimaryIdentifier, SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'
import {
  isIIdentifier,
  isManagedIdentifierDidResult,
  isManagedIdentifierResult,
  ManagedIdentifierMethod,
  ManagedIdentifierResult,
  managedIdentifierToJwk,
} from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { keyTypeFromCryptographicSuite } from '@sphereon/ssi-sdk-ext.key-utils'
import { defaultHasher } from '@sphereon/ssi-sdk.core'
import { IBasicCredentialLocaleBranding, IBasicIssuerLocaleBranding } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialMapper,
  Hasher,
  IVerifiableCredential,
  JoseSignatureAlgorithm,
  JoseSignatureAlgorithmString,
  mdocDecodedCredentialToUniformCredential,
  OriginalVerifiableCredential,
  sdJwtDecodedCredentialToUniformCredential,
  SdJwtDecodedVerifiableCredential,
  SdJwtTypeMetadata,
  W3CVerifiableCredential,
  WrappedVerifiableCredential,
} from '@sphereon/ssi-types'
import { asArray } from '@veramo/utils'
import { translate } from '../localization/Localization'
import { FirstPartyMachine } from '../machines/firstPartyMachine'
import { issuerLocaleBrandingFrom, oid4vciGetCredentialBrandingFrom, sdJwtGetCredentialBrandingFrom } from '../mappers/OIDC4VCIBrandingMapper'
import { FirstPartyMachineState, FirstPartyMachineStateTypes } from '../types/FirstPartyMachine'
import {
  DidAgents,
  GetBasicIssuerLocaleBrandingArgs,
  GetCredentialBrandingArgs,
  GetCredentialConfigsSupportedArgs,
  GetCredentialConfigsSupportedBySingleTypeOrIdArgs,
  GetIdentifierArgs,
  GetIssuanceCryptoSuiteArgs,
  GetIssuanceDidMethodArgs,
  GetIssuanceOptsArgs,
  GetPreferredCredentialFormatsArgs,
  IssuanceOpts,
  MapCredentialToAcceptArgs,
  MappedCredentialToAccept,
  OID4VCIHolderEvent,
  RequiredContext,
  SelectAppLocaleBrandingArgs,
  StartFirstPartApplicationMachine,
  VerificationResult,
  VerifyCredentialToAcceptArgs,
} from '../types/IOID4VCIHolder'

export const getCredentialBranding = async (args: GetCredentialBrandingArgs): Promise<Record<string, Array<IBasicCredentialLocaleBranding>>> => {
  const { credentialsSupported, context } = args
  const credentialBranding: Record<string, Array<IBasicCredentialLocaleBranding>> = {}
  await Promise.all(
    Object.entries(credentialsSupported).map(async ([configId, credentialsConfigSupported]): Promise<void> => {
      let sdJwtTypeMetadata: SdJwtTypeMetadata | undefined
      if (credentialsConfigSupported.format === 'dc+sd-jwt') {
        const vct = (<CredentialSupportedSdJwtVc | CredentialConfigurationSupportedSdJwtVcV1_0_15>credentialsConfigSupported).vct
        if (vct.startsWith('http')) {
          try {
            sdJwtTypeMetadata = await context.agent.fetchSdJwtTypeMetadataFromVctUrl({ vct })
          } catch {
            // For now, we are just going to ignore and continue without any branding as we still have a fallback
          }
        }
      }
      let mappedLocaleBranding: Array<IBasicCredentialLocaleBranding> = []
      if (sdJwtTypeMetadata) {
        mappedLocaleBranding = await sdJwtGetCredentialBrandingFrom({
          credentialDisplay: sdJwtTypeMetadata.display,
          claimsMetadata: sdJwtTypeMetadata.claims,
        })
      } else {
        mappedLocaleBranding = await oid4vciGetCredentialBrandingFrom({
          credentialDisplay: credentialsConfigSupported.display,
          issuerCredentialSubject:
            // @ts-ignore // FIXME SPRIND-123 add proper support for type recognition as claim display can be located elsewhere for v13
            credentialsSupported.claims !== undefined ? credentialsConfigSupported.claims : credentialsConfigSupported.credentialSubject,
        })
      }
      // TODO we should make the mapper part of the plugin, so that the logic for getting the branding becomes more clear and easier to use
      const localeBranding = await Promise.all(
        mappedLocaleBranding.map(
          async (localeBranding): Promise<IBasicCredentialLocaleBranding> => await context.agent.ibCredentialLocaleBrandingFrom({ localeBranding }),
        ),
      )
      const defaultCredentialType = 'VerifiableCredential'
      const configSupportedTypes = getTypesFromCredentialSupported(credentialsConfigSupported)
      const credentialTypes: Array<string> = configSupportedTypes.length === 0 ? asArray(defaultCredentialType) : configSupportedTypes
      const filteredCredentialTypes = credentialTypes.filter((type: string): boolean => type !== defaultCredentialType)
      credentialBranding[filteredCredentialTypes[0]] = localeBranding // TODO for now taking the first type
    }),
  )

  return credentialBranding
}

export const getBasicIssuerLocaleBranding = async (args: GetBasicIssuerLocaleBrandingArgs): Promise<Array<IBasicIssuerLocaleBranding>> => {
  const { display, dynamicRegistrationClientMetadata, context } = args
  return await Promise.all(
    display.map(async (issuerDisplay: MetadataDisplay): Promise<IBasicIssuerLocaleBranding> => {
      // FIXME for now we do not have locale support for dynamicRegistrationClientMetadata, so we add all the metadata to every locale
      const branding = await issuerLocaleBrandingFrom({ issuerDisplay, dynamicRegistrationClientMetadata })
      return context.agent.ibIssuerLocaleBrandingFrom({ localeBranding: branding })
    }),
  )
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

export const selectCredentialLocaleBranding = async (
  args: SelectAppLocaleBrandingArgs,
): Promise<IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding | undefined> => {
  const { locale, localeBranding } = args

  return localeBranding?.find(
    (branding: IBasicCredentialLocaleBranding | IBasicIssuerLocaleBranding) =>
      locale ? branding.locale?.startsWith(locale) || branding.locale === undefined : branding.locale === undefined, // TODO refactor as we have duplicate code
  )
}

export const verifyCredentialToAccept = async (args: VerifyCredentialToAcceptArgs): Promise<VerificationResult> => {
  const { mappedCredential, hasher, onVerifyEBSICredentialIssuer, schemaValidation, context } = args

  const credential = extractCredentialFromResponse(mappedCredential.credentialToAccept.credentialResponse)

  const wrappedVC = CredentialMapper.toWrappedVerifiableCredential(credential, { hasher: hasher ?? defaultHasher })
  if (
    wrappedVC.decoded?.iss?.includes('did:ebsi:') ||
    (typeof wrappedVC.decoded?.vc?.issuer === 'string'
      ? wrappedVC.decoded?.vc?.issuer?.includes('did:ebsi:')
      : wrappedVC.decoded?.vc?.issuer?.existingInstanceId?.includes('did:ebsi:'))
  ) {
    // TODO: Skipping VC validation for EBSI conformance issued credential, as their Issuer is not present in the ledger (sigh)
    // just calling the verifySchema functionality for ebsi credentials
    await context.agent.cvVerifySchema({ credential, hasher, validationPolicy: schemaValidation })
    if (JSON.stringify(wrappedVC.decoded).includes('vc:ebsi:conformance')) {
      return { source: wrappedVC, error: undefined, result: true, subResults: [] } satisfies VerificationResult
    }

    if (onVerifyEBSICredentialIssuer) {
      try {
        await onVerifyEBSICredentialIssuer({
          wrappedVc: wrappedVC,
        })
      } catch (e) {
        return { source: wrappedVC, error: e.message, result: true, subResults: [] } satisfies VerificationResult
      }
    }
  }

  const verificationResult: VerificationResult = await context.agent.cvVerifyCredential({
    credential,
    hasher,
    // TODO WAL-675 we might want to allow these types of options as part of the context, now we have state machines. Allows us to pre-determine whether these policies apply and whether remote context should be fetched
    fetchRemoteContexts: true,
    policies: {
      schemaValidation: schemaValidation,
      credentialStatus: false,
      expirationDate: false,
      issuanceDate: false,
    },
  })

  if (!verificationResult.result || verificationResult.error) {
    return Promise.reject(Error(verificationResult.error ?? translate('oid4vci_machine_credential_verification_failed_message')))
  }
  return verificationResult
}

export const mapCredentialToAccept = async (args: MapCredentialToAcceptArgs): Promise<MappedCredentialToAccept> => {
  const { credentialToAccept, hasher } = args

  const verifiableCredential = extractCredentialFromResponse(credentialToAccept.credentialResponse) as W3CVerifiableCredential

  const wrappedVerifiableCredential: WrappedVerifiableCredential = CredentialMapper.toWrappedVerifiableCredential(
    verifiableCredential as OriginalVerifiableCredential,
    { hasher },
  )
  let uniformVerifiableCredential: IVerifiableCredential
  if (CredentialMapper.isSdJwtDecodedCredential(wrappedVerifiableCredential.credential)) {
    uniformVerifiableCredential = await sdJwtDecodedCredentialToUniformCredential(
      <SdJwtDecodedVerifiableCredential>wrappedVerifiableCredential.credential,
    )
  } else if (CredentialMapper.isSdJwtEncoded(wrappedVerifiableCredential.credential)) {
    if (!hasher) {
      return Promise.reject('a hasher is required for encoded SD-JWT credentials')
    }
    const asyncHasher: Hasher = (data: string | ArrayBuffer, algorithm: string) => Promise.resolve(hasher(data, algorithm))
    const decodedSdJwt = await CredentialMapper.decodeSdJwtVcAsync(wrappedVerifiableCredential.credential, asyncHasher)
    uniformVerifiableCredential = sdJwtDecodedCredentialToUniformCredential(<SdJwtDecodedVerifiableCredential>decodedSdJwt)
  } else if (CredentialMapper.isMsoMdocDecodedCredential(wrappedVerifiableCredential.credential)) {
    uniformVerifiableCredential = mdocDecodedCredentialToUniformCredential(wrappedVerifiableCredential.credential)
  } else {
    uniformVerifiableCredential = <IVerifiableCredential>wrappedVerifiableCredential.credential
  }

  const correlationId: string =
    typeof uniformVerifiableCredential.issuer === 'string'
      ? uniformVerifiableCredential.issuer
      : CredentialMapper.isSdJwtDecodedCredential(uniformVerifiableCredential)
        ? uniformVerifiableCredential.decodedPayload.iss
        : uniformVerifiableCredential.issuer.id

  const credentialResponse = credentialToAccept.credentialResponse as CredentialResponseV1_0_15
  return {
    correlationId,
    credentialToAccept,
    types: credentialToAccept.types,
    rawVerifiableCredential: verifiableCredential,
    uniformVerifiableCredential,
    ...(credentialResponse.credential_subject_issuance && { credential_subject_issuance: credentialResponse.credential_subject_issuance }),
  }
}

export const extractCredentialFromResponse = (credentialResponse: CredentialResponse): OriginalVerifiableCredential => {
  let credential: OriginalVerifiableCredential | undefined

  if ('credential' in credentialResponse) {
    credential = credentialResponse.credential as OriginalVerifiableCredential
  } else if (
    'credentials' in credentialResponse &&
    credentialResponse.credentials &&
    Array.isArray(credentialResponse.credentials) &&
    credentialResponse.credentials.length > 0
  ) {
    credential = credentialResponse.credentials[0].credential as OriginalVerifiableCredential // FIXME SSISDK-13 (no multi-credential support yet)
  }

  if (!credential) {
    throw new Error('No credential found in credential response')
  }

  return credential
}

export const getIdentifierOpts = async (args: GetIdentifierArgs): Promise<ManagedIdentifierResult> => {
  const { issuanceOpt, context } = args
  const { identifier: identifierArg } = issuanceOpt
  if (identifierArg && isManagedIdentifierResult(identifierArg)) {
    return identifierArg
  }
  const {
    supportedPreferredDidMethod,
    supportedBindingMethods,
    keyType = 'Secp256r1',
    kms = await context.agent.keyManagerGetDefaultKeyManagementSystem(),
  } = issuanceOpt
  let identifier: ManagedIdentifierResult

  if (identifierArg) {
    if (isIIdentifier(identifierArg.identifier)) {
      identifier = await context.agent.identifierManagedGet(identifierArg)
    } else if (!identifierArg.method && issuanceOpt.supportedBindingMethods.includes('jwk')) {
      identifier = await managedIdentifierToJwk(identifierArg, context)
    } else if (identifierArg.method && !supportedBindingMethods.includes(identifierArg.method)) {
      throw Error(`Supplied identifier method ${identifierArg.method} not supported by the issuer: ${supportedBindingMethods.join(',')}`)
    } else {
      identifier = await context.agent.identifierManagedGet(identifierArg)
    }
  }
  const agentContext = { ...context, agent: context.agent as DidAgents }

  if (
    (!identifierArg || isIIdentifier(identifierArg.identifier)) &&
    supportedPreferredDidMethod &&
    (!supportedBindingMethods || supportedBindingMethods.length === 0 || supportedBindingMethods.filter((method) => method.startsWith('did')))
  ) {
    // previous code for managing DIDs only
    const { result, created } = await getOrCreatePrimaryIdentifier(agentContext, {
      method: supportedPreferredDidMethod,
      createOpts: {
        options: {
          type: issuanceOpt.keyType,
          use: KeyUse.Signature,
          codecName: issuanceOpt.codecName,
          kms: issuanceOpt.kms,
        },
      },
    })
    identifier = await context.agent.identifierManagedGetByDid({
      identifier: result,
      keyType,
      offlineWhenNoDIDRegistered: result.did.startsWith('did:ebsi:'),
    })
    if (created) {
      await agentContext.agent.emit(OID4VCIHolderEvent.IDENTIFIER_CREATED, { identifier })
    }
  } else if (supportedBindingMethods.includes('jwk')) {
    // todo: we probably should do something similar as with DIDs for re-use/new keys
    const key = await context.agent.keyManagerCreate({ type: keyType, kms, meta: { keyAlias: `key_${keyType}_${Date.now()}` } })
    // TODO. Create/move this to identifier service await agentContext.agent.emit(OID4VCIHolderEvent.IDENTIFIER_CREATED, { key })
    identifier = await managedIdentifierToJwk({ method: 'key', identifier: key, kmsKeyRef: key.kid }, context)
    // } else if (supportedBindingMethods.includes('cose_key')) {
    //   // TODO COSE HERE
    //   throw Error(`Holder currently does not support binding method: ${supportedBindingMethods.join(',')}`)
  } else {
    throw Error(`Holder currently does not support binding method: ${supportedBindingMethods.join(',')}`)
  }
  args.issuanceOpt.identifier = identifier
  return identifier
}

export const getCredentialConfigsSupportedMerged = async (
  args: GetCredentialConfigsSupportedArgs,
): Promise<Record<string, CredentialConfigurationSupported>> => {
  let result = {} as Record<string, CredentialConfigurationSupported>
  ;(await getCredentialConfigsSupported(args)).forEach((supported: Record<string, CredentialConfigurationSupported>) => {
    result = { ...result, ...supported }
  })
  return result
}

export const getCredentialConfigsSupported = async (
  args: GetCredentialConfigsSupportedArgs,
): Promise<Array<Record<string, CredentialConfigurationSupported>>> => {
  const { types, configurationIds } = args
  if (Array.isArray(types) && types.length > 0) {
    return Promise.all(types.map((type) => getCredentialConfigsSupportedBySingleTypeOrId({ ...args, types: type })))
  } else if (Array.isArray(configurationIds) && configurationIds.length > 0) {
    return Promise.all(
      configurationIds.map((configurationId) =>
        getCredentialConfigsSupportedBySingleTypeOrId({
          ...args,
          configurationId,
          types: undefined,
        }),
      ),
    )
  }
  const configs = await getCredentialConfigsSupportedBySingleTypeOrId({
    ...args,
    types: undefined,
    configurationId: undefined,
  })
  return configs && Object.keys(configs).length > 0 ? [configs] : []
}
/**
 * Please note that this method only returns configs supported for a single set of credential types or a single config id.
 * If an offer contains multiple formats/types in an array or multiple config ids, you will have to call this method for all of them
 * @param args
 */
export const getCredentialConfigsSupportedBySingleTypeOrId = async (
  args: GetCredentialConfigsSupportedBySingleTypeOrIdArgs,
): Promise<Record<string, CredentialConfigurationSupported>> => {
  const { client, vcFormatPreferences, configurationId } = args
  let { format = undefined, types = undefined } = args

  function createIdFromTypes(supported: CredentialConfigurationSupported) {
    const format = supported.format
    const type: string = getTypesFromObject(supported)?.join() ?? ''
    const id = `${type}:${format}`
    return id
  }

  if (configurationId) {
    if (!format) {
      return Promise.reject(Error('format parameter missing from input'))
    }
    const allSupported = client.getCredentialsSupported(format)
    return Object.fromEntries(
      Object.entries(allSupported).filter(
        ([id, supported]) => id === configurationId || supported.id === configurationId || createIdFromTypes(supported) === configurationId,
      ),
    )
  }

  if (!client.credentialOffer) {
    return Promise.reject(Error('openID4VCIClient has no credentialOffer'))
  }
  if (!types) {
    return Promise.reject(Error('openID4VCIClient has no types'))
  }

  const offerSupported = getSupportedCredentials({
    types: [types],
    format,
    version: client.version(),
    issuerMetadata: client.endpointMetadata.credentialIssuerMetadata,
  })
  let allSupported: Record<string, CredentialConfigurationSupported>

  if (!Array.isArray(offerSupported)) {
    allSupported = offerSupported
  } else {
    allSupported = {} satisfies Record<string, CredentialConfigurationSupported>
    offerSupported.forEach((supported) => {
      if (supported.id) {
        allSupported[supported.id as string] = supported
        return
      }
      const id = createIdFromTypes(supported)
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
      Object.entries(credentialConfigsSupported).filter(([configId, config]) => credentialOffer.credential_configuration_ids.includes(configId)),
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
    // serverMetadata,
    context,
    didMethodPreferences,
    jwtCryptographicSuitePreferences,
    jsonldCryptographicSuitePreferences,
    forceIssuanceOpt,
  } = args

  if (credentialsSupported === undefined || Object.keys(credentialsSupported).length === 0) {
    return Promise.reject(Error('No credentials supported'))
  }

  const getIssuanceOpts: Array<Promise<IssuanceOpts>> = Object.values(credentialsSupported).map(async (credentialSupported) => {
    /*if (!serverMetadata?.credentialIssuerMetadata) {
      return await getDefaultIssuanceOpts({ credentialSupported, opts: { client }, context })
    }*/

    const cryptographicSuite: string = await getIssuanceCryptoSuite({
      credentialSupported,
      client,
      jwtCryptographicSuitePreferences,
      jsonldCryptographicSuitePreferences,
    })
    const { didMethod, methods } = await getIssuanceMethod({
      credentialSupported,
      client,
      didMethodPreferences,
    })
    if (methods.length == 0) {
      console.log(`Could not determine supported cryptographic_binding_methods_supported, will use DIDs`)
      methods.push('did')
    }
    const issuanceOpt = forceIssuanceOpt
      ? { ...credentialSupported, ...forceIssuanceOpt }
      : ({
          ...credentialSupported,
          supportedPreferredDidMethod: didMethod,
          supportedBindingMethods: methods,
          format: credentialSupported.format,
          keyType: client.isEBSI() ? 'Secp256r1' : keyTypeFromCryptographicSuite({ crv: cryptographicSuite }),
          ...(client.isEBSI() && { codecName: 'EBSI' }),
        } satisfies IssuanceOpts)
    const identifier = await getIdentifierOpts({ issuanceOpt, context })
    if (!client.clientId && isManagedIdentifierDidResult(identifier)) {
      // FIXME: We really should fetch server metadata. Have user select required credentials. Take the first cred to determine a kid when no clientId is present and set that.
      //  Needs a preference service for crypto, keys, dids, and clientId, with ecosystem support
      client.clientId = identifier.issuer ?? identifier.did
    }
    return { ...issuanceOpt, identifier }
  })

  return await Promise.all(getIssuanceOpts)
}

export const getIssuanceMethod = async (
  opts: GetIssuanceDidMethodArgs,
): Promise<{
  methods: ManagedIdentifierMethod[]
  didMethod?: SupportedDidMethodEnum
}> => {
  const { client, credentialSupported, didMethodPreferences } = opts
  const { format, cryptographic_binding_methods_supported } = credentialSupported
  let methods: ManagedIdentifierMethod[] = [] // we use the external identifier method, as we should be supporting all values in the server metadata anyway
  if (cryptographic_binding_methods_supported && Array.isArray(cryptographic_binding_methods_supported)) {
    methods = cryptographic_binding_methods_supported as ManagedIdentifierMethod[]
    const didMethods: SupportedDidMethodEnum | undefined = didMethodPreferences.find((method: SupportedDidMethodEnum) =>
      cryptographic_binding_methods_supported.includes(`did:${method.toLowerCase() /*.replace('did:', '')*/}`),
    )
    if (didMethods) {
      return { methods, didMethod: didMethods }
    } else if (cryptographic_binding_methods_supported.includes('did')) {
      return { methods, didMethod: format ? didMethodPreferences[1] : didMethodPreferences[0] }
    } else if (methods.length > 0) {
      return { methods }
    }
    console.warn(
      `We should have been able to determine cryptographic_binding_methods_supported, will fall back to legacy behaviour. This is likely a bug`,
    )
  }

  if (client.isEBSI()) {
    return { methods: ['did'], didMethod: SupportedDidMethodEnum.DID_KEY }
  }

  // legacy fallback
  methods = ['did']
  if (!format || (format.includes('jwt') && !format?.includes('jwt_vc_json_ld'))) {
    return { methods, didMethod: format ? didMethodPreferences[1] : didMethodPreferences[0] }
  } else {
    // JsonLD
    return { methods, didMethod: didMethodPreferences[0] }
  }
}

export const getIssuanceCryptoSuite = async (opts: GetIssuanceCryptoSuiteArgs): Promise<string> => {
  const { client, credentialSupported, jwtCryptographicSuitePreferences, jsonldCryptographicSuitePreferences } = opts

  let signing_algs_supported: Array<string>
  if ('proof_types_supported' in credentialSupported && credentialSupported.proof_types_supported) {
    if ('jwt' in credentialSupported.proof_types_supported && credentialSupported.proof_types_supported.jwt) {
      signing_algs_supported = credentialSupported.proof_types_supported.jwt.proof_signing_alg_values_supported
    } else if ('ldp_vp' in credentialSupported.proof_types_supported && credentialSupported.proof_types_supported.ldp_vp) {
      signing_algs_supported = credentialSupported.proof_types_supported.ldp_vp.proof_signing_alg_values_supported
    } else if ('cwt' in credentialSupported.proof_types_supported && credentialSupported.proof_types_supported.cwt) {
      signing_algs_supported = credentialSupported.proof_types_supported.cwt.proof_signing_alg_values_supported
      console.error('cwt proof type not supported. Likely that errors will occur after this point')
    } else {
      return Promise.reject(Error(`Unsupported proof_types_supported`))
    }
  } else {
    signing_algs_supported = asArray(
      // @ts-ignore // legacy
      credentialSupported.credential_signing_alg_values_supported ?? credentialSupported.proof_signing_alg_values_supported ?? [],
    )
  }

  // TODO: Return array, so the wallet/user could choose
  switch (credentialSupported.format) {
    // @ts-ignore legacy value
    case 'jwt':
    case 'jwt_vc_json':
    case 'jwt_vc':
    //case 'vc+sd-jwt': // TODO see SSISDK-52 concerning vc+sd-jwt
    case 'dc+sd-jwt':
    case 'mso_mdoc': {
      const supportedPreferences: Array<JoseSignatureAlgorithm | JoseSignatureAlgorithmString> = jwtCryptographicSuitePreferences.filter(
        (suite: JoseSignatureAlgorithm | JoseSignatureAlgorithmString) => signing_algs_supported.includes(suite),
      )

      if (supportedPreferences.length > 0) {
        return supportedPreferences[0]
      } else if (client.isEBSI()) {
        return JoseSignatureAlgorithm.ES256
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

export const startFirstPartApplicationMachine = async (
  args: StartFirstPartApplicationMachine,
  context: RequiredContext,
): Promise<AuthorizationChallengeCodeResponse | string> => {
  const { openID4VCIClientState, stateNavigationListener, contact } = args

  if (!openID4VCIClientState) {
    return Promise.reject(Error('Missing openID4VCI client state in context'))
  }

  if (!contact) {
    return Promise.reject(Error('Missing contact in context'))
  }

  const firstPartyMachineInstance = FirstPartyMachine.newInstance({
    openID4VCIClientState,
    contact,
    agentContext: context,
    stateNavigationListener,
  })

  return new Promise((resolve, reject) => {
    try {
      firstPartyMachineInstance.onTransition((state: FirstPartyMachineState) => {
        if (state.matches(FirstPartyMachineStateTypes.done)) {
          const authorizationCodeResponse = state.context.authorizationCodeResponse
          if (!authorizationCodeResponse) {
            reject(Error('No authorizationCodeResponse acquired'))
          }
          resolve(authorizationCodeResponse!)
        } else if (state.matches(FirstPartyMachineStateTypes.aborted)) {
          resolve(FirstPartyMachineStateTypes.aborted)
        } else if (state.matches(FirstPartyMachineStateTypes.declined)) {
          resolve(FirstPartyMachineStateTypes.declined)
        } else if (state.matches(FirstPartyMachineStateTypes.error)) {
          reject(state.context.error)
        }
      })
      firstPartyMachineInstance.start()
    } catch (error) {
      reject(error)
    }
  })
}
