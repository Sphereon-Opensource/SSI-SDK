import { CredentialOfferClient, MetadataClient, OpenID4VCIClient } from '@sphereon/oid4vci-client'
import {
  AuthorizationDetails,
  AuthorizationRequestOpts,
  AuthorizationServerClientOpts,
  AuthorizationServerOpts,
  CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0_15,
  CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0_15,
  CredentialOfferRequestWithBaseUrl,
  DefaultURISchemes,
  EndpointMetadataResult,
  getTypesFromAuthorizationDetails,
  getTypesFromCredentialOffer,
  getTypesFromObject,
  Jwt,
  NotificationRequest,
  ProofOfPossessionCallbacks,
} from '@sphereon/oid4vci-common'
import { SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'
import {
  IIdentifierResolution,
  isManagedIdentifierDidOpts,
  isManagedIdentifierDidResult,
  isManagedIdentifierJwkResult,
  isManagedIdentifierKidResult,
  isManagedIdentifierResult,
  isManagedIdentifierX5cOpts,
  isManagedIdentifierX5cResult,
  ManagedIdentifierOptsOrResult,
} from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { IJwtService, JwsHeader } from '@sphereon/ssi-sdk-ext.jwt-service'
import { signatureAlgorithmFromKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { defaultHasher } from '@sphereon/ssi-sdk.core'
import {
  ConnectionType,
  CorrelationIdentifierType,
  CredentialCorrelationType,
  CredentialRole,
  ensureRawDocument,
  FindPartyArgs,
  IBasicCredentialLocaleBranding,
  IBasicIssuerLocaleBranding,
  Identity,
  IdentityOrigin,
  IIssuerLocaleBranding,
  NonPersistedIdentity,
  Party,
} from '@sphereon/ssi-sdk.data-store'
import {
  CredentialMapper,
  type CredentialProofFormat,
  HasherSync,
  IVerifiableCredential,
  JoseSignatureAlgorithm,
  JoseSignatureAlgorithmString,
  JwtDecodedVerifiableCredential,
  Loggers,
  parseDid,
  SdJwtDecodedVerifiableCredentialPayload,
  WrappedW3CVerifiableCredential,
} from '@sphereon/ssi-types'
import {
  CredentialPayload,
  IAgentContext,
  IAgentPlugin,
  IDIDManager,
  IKeyManager,
  IResolver,
  VerifiableCredential,
  W3CVerifiableCredential,
} from '@veramo/core'
import { asArray, computeEntryHash } from '@veramo/utils'
import { decodeJWT } from 'did-jwt'
import { v4 as uuidv4 } from 'uuid'
import { OID4VCIMachine } from '../machines/oid4vciMachine'
import {
  extractCredentialFromResponse,
  getBasicIssuerLocaleBranding,
  getCredentialBranding,
  getCredentialConfigsSupportedMerged,
  getIdentifierOpts,
  getIssuanceOpts,
  mapCredentialToAccept,
  selectCredentialLocaleBranding,
  startFirstPartApplicationMachine,
  verifyCredentialToAccept,
} from '../services/OID4VCIHolderService'
import 'cross-fetch/polyfill'
import {
  AddContactIdentityArgs,
  AssertValidCredentialsArgs,
  Attribute,
  CreateCredentialsToSelectFromArgs,
  CredentialToAccept,
  CredentialToSelectFromResult,
  GetContactArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  GetFederationTrustArgs,
  GetIssuerBrandingArgs,
  GetIssuerMetadataArgs,
  IOID4VCIHolder,
  IssuanceOpts,
  MappedCredentialToAccept,
  OID4VCIHolderEvent,
  OID4VCIHolderOptions,
  OID4VCIMachine as OID4VCIMachineId,
  OID4VCIMachineInstanceOpts,
  OID4VCIMachineServiceDefinitions,
  OID4VCIMachineServices,
  OnContactIdentityCreatedArgs,
  OnCredentialStoredArgs,
  OnIdentifierCreatedArgs,
  PrepareStartArgs,
  RequestType,
  RequiredContext,
  SendNotificationArgs,
  StartFirstPartApplicationMachine,
  StartResult,
  StoreCredentialBrandingArgs,
  StoreCredentialsArgs,
  StoreIssuerBrandingArgs,
  VerificationResult,
  VerifyEBSICredentialIssuerArgs,
  VerifyEBSICredentialIssuerResult,
} from '../types/IOID4VCIHolder'

/**
 * {@inheritDoc IOID4VCIHolder}
 */

// Exposing the methods here for any REST implementation
export const oid4vciHolderContextMethods: Array<string> = [
  'cmGetContacts',
  'cmGetContact',
  'cmAddContact',
  'cmAddIdentity',
  'ibCredentialLocaleBrandingFrom',
  'ibAddCredentialBranding',
  'dataStoreSaveVerifiableCredential',
  'didManagerFind',
  'didManagerGet',
  'keyManagerSign',
  'verifyCredential',
]

const logger = Loggers.DEFAULT.get('sphereon:oid4vci:holder')

export function signCallback(
  identifier: ManagedIdentifierOptsOrResult,
  context: IAgentContext<IKeyManager & IDIDManager & IResolver & IIdentifierResolution & IJwtService>,
  nonce?: string,
) {
  return async (jwt: Jwt, kid?: string, noIssPayloadUpdate?: boolean) => {
    let resolution = await context.agent.identifierManagedGet(identifier)
    const jwk = jwt.header.jwk ?? (resolution.method === 'jwk' ? resolution.jwk : undefined)
    if (!resolution.issuer && !jwt.payload.iss) {
      return Promise.reject(Error(`No issuer could be determined from the JWT ${JSON.stringify(jwt)} or identifier resolution`))
    }
    const header = jwt.header as JwsHeader
    const payload = jwt.payload
    if (nonce) {
      payload.nonce = nonce
    }
    if (jwk && header.kid) {
      console.log(
        `Deleting kid, as we are using a jwk and the oid4vci spec does not allow both to be present (which is not the case in the JOSE spec)`,
      )
      delete header.kid // The OID4VCI spec does not allow a JWK with kid present although the JWS spec does
    }
    return (
      await context.agent.jwtCreateJwsCompactSignature({
        issuer: { ...resolution, noIssPayloadUpdate: noIssPayloadUpdate ?? false },
        protectedHeader: header,
        payload,
      })
    ).jwt
  }
}

export async function verifyEBSICredentialIssuer(args: VerifyEBSICredentialIssuerArgs): Promise<VerifyEBSICredentialIssuerResult> {
  const { wrappedVc, issuerType = ['TI'] } = args

  const issuer =
    wrappedVc.decoded?.iss ??
    (typeof wrappedVc.decoded?.vc?.issuer === 'string' ? wrappedVc.decoded?.vc?.issuer : wrappedVc.decoded?.vc?.issuer?.existingInstanceId)

  if (!issuer) {
    throw Error('The issuer of the VC is required to be present')
  }

  const url = `https://api-conformance.ebsi.eu/trusted-issuers-registry/v4/issuers/${issuer}`
  const response = await fetch(url)
  if (response.status !== 200) {
    throw Error('The issuer of the VC cannot be trusted')
  }

  const payload = (await response.json()) as VerifyEBSICredentialIssuerResult

  if (!payload.attributes.some((a: Attribute) => issuerType.includes(a.issuerType))) {
    throw Error(`The issuer type is required to be one of: ${issuerType.join(', ')}`)
  }

  return payload
}

export class OID4VCIHolder implements IAgentPlugin {
  private readonly hasher?: HasherSync
  readonly eventTypes: Array<OID4VCIHolderEvent> = [
    OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED,
    OID4VCIHolderEvent.CREDENTIAL_STORED,
    OID4VCIHolderEvent.IDENTIFIER_CREATED,
  ]

  readonly methods: IOID4VCIHolder = {
    oid4vciHolderStart: this.oid4vciHolderStart.bind(this),
    oid4vciHolderGetIssuerMetadata: this.oid4vciHolderGetIssuerMetadata.bind(this),
    oid4vciHolderGetMachineInterpreter: this.oid4vciHolderGetMachineInterpreter.bind(this),
    oid4vciHolderCreateCredentialsToSelectFrom: this.oid4vciHolderCreateCredentialsToSelectFrom.bind(this),
    oid4vciHolderGetContact: this.oid4vciHolderGetContact.bind(this),
    oid4vciHolderGetCredentials: this.oid4vciHolderGetCredentials.bind(this),
    oid4vciHolderGetCredential: this.oid4vciHolderGetCredential.bind(this),
    oid4vciHolderAddContactIdentity: this.oid4vciHolderAddContactIdentity.bind(this),
    oid4vciHolderAssertValidCredentials: this.oid4vciHolderAssertValidCredentials.bind(this),
    oid4vciHolderStoreCredentialBranding: this.oid4vciHolderStoreCredentialBranding.bind(this),
    oid4vciHolderStoreCredentials: this.oid4vciHolderStoreCredentials.bind(this),
    oid4vciHolderSendNotification: this.oid4vciHolderSendNotification.bind(this),
    oid4vciHolderGetIssuerBranding: this.oid4vciHolderGetIssuerBranding.bind(this),
    oid4vciHolderStoreIssuerBranding: this.oid4vciHolderStoreIssuerBranding.bind(this),
  }

  private readonly vcFormatPreferences: Array<string> = ['dc+sd-jwt', 'vc+sd-jwt', 'mso_mdoc', 'jwt_vc_json', 'jwt_vc', 'ldp_vc']
  private readonly jsonldCryptographicSuitePreferences: Array<string> = [
    'Ed25519Signature2018',
    'EcdsaSecp256k1Signature2019',
    'Ed25519Signature2020',
    'JsonWebSignature2020',
    // "JcsEd25519Signature2020"
  ]
  private readonly didMethodPreferences: Array<SupportedDidMethodEnum> = [
    SupportedDidMethodEnum.DID_JWK, // FIXME prefer JWK until we devise a method to detect when to use EBSI/jcs for did:key and when not
    SupportedDidMethodEnum.DID_KEY,
    SupportedDidMethodEnum.DID_OYD,
    SupportedDidMethodEnum.DID_EBSI,
    SupportedDidMethodEnum.DID_ION,
  ]
  private readonly jwtCryptographicSuitePreferences: Array<JoseSignatureAlgorithm | JoseSignatureAlgorithmString> = [
    JoseSignatureAlgorithm.ES256,
    JoseSignatureAlgorithm.ES256K,
    JoseSignatureAlgorithm.EdDSA,
  ]
  private static readonly DEFAULT_MOBILE_REDIRECT_URI = `${DefaultURISchemes.CREDENTIAL_OFFER}://`
  private readonly defaultAuthorizationRequestOpts: AuthorizationRequestOpts = { redirectUri: OID4VCIHolder.DEFAULT_MOBILE_REDIRECT_URI }
  private readonly onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  private readonly onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  private readonly onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
  private readonly onVerifyEBSICredentialIssuer?: (args: VerifyEBSICredentialIssuerArgs) => Promise<VerifyEBSICredentialIssuerResult>

  constructor(options?: OID4VCIHolderOptions) {
    const {
      onContactIdentityCreated,
      onCredentialStored,
      onIdentifierCreated,
      onVerifyEBSICredentialIssuer,
      vcFormatPreferences,
      jsonldCryptographicSuitePreferences,
      didMethodPreferences,
      jwtCryptographicSuitePreferences,
      defaultAuthorizationRequestOptions,
      hasher = defaultHasher,
    } = { ...options }

    this.hasher = hasher
    if (vcFormatPreferences !== undefined && vcFormatPreferences.length > 0) {
      this.vcFormatPreferences = vcFormatPreferences
    }
    if (jsonldCryptographicSuitePreferences !== undefined && jsonldCryptographicSuitePreferences.length > 0) {
      this.jsonldCryptographicSuitePreferences = jsonldCryptographicSuitePreferences
    }
    if (didMethodPreferences !== undefined && didMethodPreferences.length > 0) {
      this.didMethodPreferences = didMethodPreferences
    }
    if (jwtCryptographicSuitePreferences !== undefined && jwtCryptographicSuitePreferences.length > 0) {
      this.jwtCryptographicSuitePreferences = jwtCryptographicSuitePreferences
    }
    if (defaultAuthorizationRequestOptions) {
      this.defaultAuthorizationRequestOpts = defaultAuthorizationRequestOptions
    }
    this.onContactIdentityCreated = onContactIdentityCreated
    this.onCredentialStored = onCredentialStored
    this.onIdentifierCreated = onIdentifierCreated
    this.onVerifyEBSICredentialIssuer = onVerifyEBSICredentialIssuer
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED:
        this.onContactIdentityCreated?.(event.data)
        break
      case OID4VCIHolderEvent.CREDENTIAL_STORED:
        this.onCredentialStored?.(event.data)
        break
      case OID4VCIHolderEvent.IDENTIFIER_CREATED:
        this.onIdentifierCreated?.(event.data)
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  /**
   * FIXME: This method can only be used locally. Creating the interpreter should be local to where the agent is running
   */
  private async oid4vciHolderGetMachineInterpreter(opts: OID4VCIMachineInstanceOpts, context: RequiredContext): Promise<OID4VCIMachineId> {
    const authorizationRequestOpts = { ...this.defaultAuthorizationRequestOpts, ...opts.authorizationRequestOpts }
    const services: OID4VCIMachineServiceDefinitions = {
      [OID4VCIMachineServices.start]: (args: PrepareStartArgs) =>
        this.oid4vciHolderStart(
          {
            ...args,
            authorizationRequestOpts,
          },
          context,
        ),
      [OID4VCIMachineServices.startFirstPartApplicationFlow]: (args: StartFirstPartApplicationMachine) =>
        startFirstPartApplicationMachine({ ...args, stateNavigationListener: opts.firstPartyStateNavigationListener }, context),
      [OID4VCIMachineServices.createCredentialsToSelectFrom]: (args: CreateCredentialsToSelectFromArgs) =>
        this.oid4vciHolderCreateCredentialsToSelectFrom(args, context),
      [OID4VCIMachineServices.getContact]: (args: GetContactArgs) => this.oid4vciHolderGetContact(args, context),
      [OID4VCIMachineServices.getCredentials]: (args: GetCredentialsArgs) =>
        this.oid4vciHolderGetCredentials({ accessTokenOpts: args.accessTokenOpts ?? opts.accessTokenOpts, ...args }, context),
      [OID4VCIMachineServices.addContactIdentity]: (args: AddContactIdentityArgs) => this.oid4vciHolderAddContactIdentity(args, context),
      [OID4VCIMachineServices.getIssuerBranding]: (args: GetIssuerBrandingArgs) => this.oid4vciHolderGetIssuerBranding(args, context),
      [OID4VCIMachineServices.storeIssuerBranding]: (args: StoreIssuerBrandingArgs) => this.oid4vciHolderStoreIssuerBranding(args, context),
      [OID4VCIMachineServices.assertValidCredentials]: (args: AssertValidCredentialsArgs) => this.oid4vciHolderAssertValidCredentials(args, context),
      [OID4VCIMachineServices.storeCredentialBranding]: (args: StoreCredentialBrandingArgs) =>
        this.oid4vciHolderStoreCredentialBranding(args, context),
      [OID4VCIMachineServices.storeCredentials]: (args: StoreCredentialsArgs) => this.oid4vciHolderStoreCredentials(args, context),
      [OID4VCIMachineServices.sendNotification]: (args: SendNotificationArgs) => this.oid4vciHolderSendNotification(args, context),
      [OID4VCIMachineServices.getFederationTrust]: (args: GetFederationTrustArgs) => this.getFederationTrust(args, context),
    }

    const oid4vciMachineInstanceArgs: OID4VCIMachineInstanceOpts = {
      ...opts,
      authorizationRequestOpts,
      services: {
        ...services,
        ...opts.services,
      },
    }

    const { interpreter } = await OID4VCIMachine.newInstance(oid4vciMachineInstanceArgs, context)

    return {
      interpreter,
    }
  }

  /**
   * This method is run before the machine starts! So there is no concept of the state machine context or states yet
   *
   * The result of this method can be directly passed into the start method of the state machine
   * @param args
   * @param context
   * @private
   */
  private async oid4vciHolderStart(args: PrepareStartArgs, context: RequiredContext): Promise<StartResult> {
    const { requestData } = args
    if (!requestData) {
      throw Error(`Cannot start the OID4VCI holder flow without request data being provided`)
    }
    const { uri = undefined } = requestData
    if (!uri) {
      return Promise.reject(Error('Missing request URI in context'))
    }

    const authorizationRequestOpts = { ...this.defaultAuthorizationRequestOpts, ...args.authorizationRequestOpts } satisfies AuthorizationRequestOpts
    // We filter the details first against our vcformat prefs
    authorizationRequestOpts.authorizationDetails = authorizationRequestOpts?.authorizationDetails
      ? asArray(authorizationRequestOpts.authorizationDetails).filter(
          (detail) => typeof detail === 'string' || this.vcFormatPreferences.includes(detail.format),
        )
      : undefined

    if (!authorizationRequestOpts.redirectUri) {
      authorizationRequestOpts.redirectUri = OID4VCIHolder.DEFAULT_MOBILE_REDIRECT_URI
    }
    if (authorizationRequestOpts.redirectUri.startsWith('http') && !authorizationRequestOpts.clientId) {
      // At least set a default for a web based wallet.
      // TODO: We really need (dynamic) client registration support
      authorizationRequestOpts.clientId = authorizationRequestOpts.redirectUri
    }

    let formats: string[] = this.vcFormatPreferences
    const authFormats = authorizationRequestOpts?.authorizationDetails
      ?.map((detail: AuthorizationDetails) => (typeof detail === 'object' && 'format' in detail && detail.format ? detail.format : undefined))
      .filter((format) => !!format)
      .map((format) => format as string)
    if (authFormats && authFormats.length > 0) {
      formats = Array.from(new Set(authFormats))
    }
    let oid4vciClient: OpenID4VCIClient
    let types: string[][] | undefined = undefined
    let offer: CredentialOfferRequestWithBaseUrl | undefined
    if (requestData.existingClientState) {
      oid4vciClient = await OpenID4VCIClient.fromState({ state: requestData.existingClientState })
      offer = oid4vciClient.credentialOffer
    } else {
      offer = requestData.credentialOffer
      if (
        uri.startsWith(RequestType.OPENID_INITIATE_ISSUANCE) ||
        uri.startsWith(RequestType.OPENID_CREDENTIAL_OFFER) ||
        uri.match(/https?:\/\/.*credential_offer(_uri)=?.*/)
      ) {
        if (!offer) {
          // Let's make sure to convert the URI to offer, as it matches the regexes. Normally this should already have happened at this point though
          offer = await CredentialOfferClient.fromURI(uri)
        }
      } else {
        if (!!offer) {
          logger.warning(`Non default URI used for credential offer: ${uri}`)
        }
      }

      if (!offer) {
        // else no offer, meaning we have an issuer URL
        logger.log(`Issuer url received (no credential offer): ${uri}`)
        oid4vciClient = await OpenID4VCIClient.fromCredentialIssuer({
          credentialIssuer: uri,
          authorizationRequest: authorizationRequestOpts,
          clientId: authorizationRequestOpts.clientId,
          createAuthorizationRequestURL: requestData.createAuthorizationRequestURL ?? true,
        })
      } else {
        logger.log(`Credential offer received: ${uri}`)
        oid4vciClient = await OpenID4VCIClient.fromURI({
          uri,
          authorizationRequest: authorizationRequestOpts,
          clientId: authorizationRequestOpts.clientId,
          createAuthorizationRequestURL: requestData.createAuthorizationRequestURL ?? true,
        })
      }
    }

    if (offer) {
      types = getTypesFromCredentialOffer(offer.original_credential_offer)
    } else {
      types = asArray(authorizationRequestOpts.authorizationDetails)
        .map((authReqOpts) => getTypesFromAuthorizationDetails(authReqOpts) ?? [])
        .filter((inner) => inner.length > 0)
    }

    const serverMetadata = await oid4vciClient.retrieveServerMetadata()
    const credentialsSupported = await getCredentialConfigsSupportedMerged({
      client: oid4vciClient,
      vcFormatPreferences: formats,
      types,
    })
    const credentialBranding = await getCredentialBranding({ credentialsSupported, context })
    const authorizationCodeURL = oid4vciClient.authorizationURL
    if (authorizationCodeURL) {
      logger.log(`authorization code URL ${authorizationCodeURL}`)
    }
    const oid4vciClientState = JSON.parse(await oid4vciClient.exportState())

    return {
      authorizationCodeURL,
      credentialBranding,
      credentialsSupported,
      serverMetadata,
      oid4vciClientState,
    }
  }

  private async oid4vciHolderCreateCredentialsToSelectFrom(
    args: CreateCredentialsToSelectFromArgs,
    context: RequiredContext,
  ): Promise<Array<CredentialToSelectFromResult>> {
    const { credentialBranding, locale, selectedCredentials /*, openID4VCIClientState*/, credentialsSupported } = args

    // const client = await OpenID4VCIClient.fromState({ state: openID4VCIClientState! }) // TODO see if we need the check openID4VCIClientState defined
    /*const credentialsSupported = await getCredentialConfigsSupportedBySingleTypeOrId({
                              client,
                              vcFormatPreferences: this.vcFormatPreferences,
                            })*/
    logger.info(`Credentials supported ${Object.keys(credentialsSupported).join(', ')}`)

    const credentialSelection: Array<CredentialToSelectFromResult> = await Promise.all(
      Object.entries(credentialsSupported).map(async ([id, credentialConfigSupported]): Promise<CredentialToSelectFromResult> => {
        // FIXME this allows for duplicate VerifiableCredential, which the user has no idea which ones those are and we also have a branding map with unique keys, so some branding will not match
        // const defaultCredentialType = 'VerifiableCredential'

        const credentialTypes = getTypesFromObject(credentialConfigSupported)
        // const credentialType = id /*?? credentialTypes?.find((type) => type !== defaultCredentialType) ?? defaultCredentialType*/
        const localeBranding = !credentialBranding
          ? undefined
          : (credentialBranding?.[id] ??
            Object.entries(credentialBranding)
              .find(([type, _brandings]) => {
                credentialTypes && type in credentialTypes
              })
              ?.map(([type, supported]) => supported))
        const credentialAlias = (
          await selectCredentialLocaleBranding({
            locale,
            localeBranding,
          })
        )?.alias

        return {
          id: uuidv4(),
          credentialId: id,
          credentialTypes: credentialTypes ?? asArray(id),
          credentialAlias: credentialAlias ?? id,
          isSelected: false,
        }
      }),
    )

    // TODO find better place to do this, would be nice if the machine does this?
    if (credentialSelection.length >= 1) {
      credentialSelection.map((sel) => selectedCredentials.push(sel.credentialId))
    }
    logger.log(`Credential selection ${JSON.stringify(credentialSelection)}`)

    return credentialSelection
  }

  private async oid4vciHolderGetContact(args: GetContactArgs, context: RequiredContext): Promise<Party | undefined> {
    const { serverMetadata } = args

    if (serverMetadata === undefined) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    const names: Set<string> = new Set(
      serverMetadata.credentialIssuerMetadata?.display
        ?.map((display) => display.name)
        .filter((name) => name != undefined)
        .map((name) => name as string) ?? [],
    )
    const name = names.size > 0 ? Array.from(names)[0] : undefined

    const correlationId: string = new URL(serverMetadata.issuer).hostname

    const filter: FindPartyArgs = [
      {
        identities: {
          identifier: {
            correlationId,
          },
        },
      },
    ]

    if (name) {
      filter.push({
        contact: {
          legalName: name,
        },
      })
      filter.push({
        contact: {
          displayName: name,
        },
      })
    }

    const parties: Array<Party> = await context.agent.cmGetContacts({
      filter,
    })

    if (parties.length > 1) {
      logger.warning(`Get contacts returned more than one result: ${parties.length}, ${parties.map((party) => party.contact.displayName).join(',')}`)
    }
    const party = parties.length >= 1 ? parties[0] : undefined

    logger.log(`Party involved: `, party)
    return party
  }

  private async oid4vciHolderGetCredentials(args: GetCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept>> {
    const { verificationCode, openID4VCIClientState, didMethodPreferences = this.didMethodPreferences, issuanceOpt, accessTokenOpts } = args
    logger.debug(`Getting credentials`, issuanceOpt, accessTokenOpts)

    if (!openID4VCIClientState) {
      return Promise.reject(Error('Missing openID4VCI client state in context'))
    }

    const client = await OpenID4VCIClient.fromState({ state: openID4VCIClientState })
    const credentialsSupported = await getCredentialConfigsSupportedMerged({
      client,
      vcFormatPreferences: this.vcFormatPreferences,
      configurationIds: args.selectedCredentials,
    })
    const serverMetadata = await client.retrieveServerMetadata()
    const issuanceOpts = await getIssuanceOpts({
      client,
      credentialsSupported,
      serverMetadata,
      context,
      didMethodPreferences: Array.isArray(didMethodPreferences) && didMethodPreferences.length > 0 ? didMethodPreferences : this.didMethodPreferences,
      jwtCryptographicSuitePreferences: this.jwtCryptographicSuitePreferences,
      jsonldCryptographicSuitePreferences: this.jsonldCryptographicSuitePreferences,
      ...(issuanceOpt && { forceIssuanceOpt: issuanceOpt }),
    })

    const getCredentials = issuanceOpts.map(
      async (issuanceOpt: IssuanceOpts): Promise<MappedCredentialToAccept> =>
        await this.oid4vciHolderGetCredential(
          {
            issuanceOpt,
            pin: verificationCode,
            client,
            accessTokenOpts,
          },
          context,
        ),
    )

    const allCredentials = await Promise.all(getCredentials)
    logger.log(`Credentials received`, allCredentials)

    return allCredentials
  }

  private async oid4vciHolderGetCredential(args: GetCredentialArgs, context: RequiredContext): Promise<MappedCredentialToAccept> {
    const { issuanceOpt, pin, client, accessTokenOpts } = args
    logger.info(`Getting credential`, issuanceOpt)

    if (!issuanceOpt) {
      return Promise.reject(Error(`Cannot get credential issuance options`))
    }

    const identifier = await getIdentifierOpts({ issuanceOpt, context })
    issuanceOpt.identifier = identifier
    logger.info(`ID opts`, identifier)
    const alg: JoseSignatureAlgorithm | JoseSignatureAlgorithmString = await signatureAlgorithmFromKey({ key: identifier.key })
    // The VCI lib either expects a jwk or a kid
    const jwk = isManagedIdentifierJwkResult(identifier) ? identifier.jwk : undefined

    const callbacks: ProofOfPossessionCallbacks = {
      signCallback: signCallback(identifier, context),
    }

    try {
      // We need to make sure we have acquired the access token
      if (!client.clientId) {
        client.clientId = isManagedIdentifierDidResult(identifier) ? identifier.did : identifier.issuer
      }
      let asOpts: AuthorizationServerOpts | undefined = undefined
      let kid = accessTokenOpts?.clientOpts?.kid ?? identifier.kid
      if (accessTokenOpts?.clientOpts) {
        const clientId = accessTokenOpts.clientOpts.clientId ?? client.clientId ?? identifier.issuer
        if (client.isEBSI() && clientId?.startsWith('http') && kid?.includes('#')) {
          kid = kid.split('#')[1]
        }

        //todo: investigate if the jwk should be used here as well if present
        const clientOpts: AuthorizationServerClientOpts = {
          ...accessTokenOpts.clientOpts,
          clientId,
          kid,
          // @ts-ignore
          alg: accessTokenOpts.clientOpts.alg ?? alg,
          signCallbacks: accessTokenOpts.clientOpts.signCallbacks ?? callbacks,
        }
        asOpts = {
          clientOpts,
        }
      }

      await client.acquireAccessToken({
        clientId: client.clientId,
        pin,
        authorizationResponse: JSON.parse(await client.exportState()).authorizationCodeResponse,
        additionalRequestParams: accessTokenOpts?.additionalRequestParams,
        ...(asOpts && { asOpts }),
      })

      // FIXME: This type mapping is wrong. It should use credential_identifier in case the access token response has authorization details
      const types = getTypesFromObject(issuanceOpt)
      const id: string | undefined = 'id' in issuanceOpt && issuanceOpt.id ? (issuanceOpt.id as string) : undefined
      const credentialTypes = asArray(issuanceOpt.credentialConfigurationId ?? types ?? id)
      if (!credentialTypes || credentialTypes.length === 0) {
        return Promise.reject(Error('cannot determine credential id to request'))
      }

      const credentialDefinition = this.getCredentialDefinition(issuanceOpt)
      const credentialResponse = await client.acquireCredentials({
        ...(credentialDefinition && { context: credentialDefinition['@context'] }),
        credentialTypes,
        proofCallbacks: callbacks,
        format: issuanceOpt.format,
        // TODO: We need to update the machine and add notifications support for actual deferred credentials instead of just waiting/retrying
        deferredCredentialAwait: true,
        ...(!jwk && { kid }), // vci client either wants a jwk or kid. If we have used the jwk method do not provide the kid
        jwk,
        alg,
        jti: uuidv4(),
      })

      const credential = {
        id: issuanceOpt.credentialConfigurationId ?? id,
        types: types ?? asArray(credentialTypes),
        issuanceOpt,
        credentialResponse,
      } satisfies CredentialToAccept
      return mapCredentialToAccept({ credentialToAccept: credential, hasher: this.hasher })
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private async oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity> {
    const { credentialsToAccept, contact } = args

    if (!contact) {
      return Promise.reject(Error('Missing contact in context'))
    }

    if (credentialsToAccept === undefined || credentialsToAccept.length === 0) {
      return Promise.reject(Error('Missing credential offers in context'))
    }

    let correlationId: string = credentialsToAccept[0].correlationId
    let identifierType = CorrelationIdentifierType.DID
    if (!correlationId.toLowerCase().startsWith('did:')) {
      identifierType = CorrelationIdentifierType.URL
      if (correlationId.startsWith('http')) {
        correlationId = new URL(correlationId).hostname
      }
    }
    const identity: NonPersistedIdentity = {
      alias: credentialsToAccept[0].correlationId,
      origin: IdentityOrigin.EXTERNAL,
      roles: [CredentialRole.ISSUER],
      identifier: {
        type: identifierType,
        correlationId,
      },
      ...(identifierType === CorrelationIdentifierType.URL && {
        connection: {
          type: ConnectionType.OPENID_CONNECT,
          config: {
            clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
            clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
            scopes: ['auth'],
            issuer: 'https://example.com/app-test',
            redirectUrl: 'app:/callback',
            dangerouslyAllowInsecureHttpRequests: true,
            clientAuthMethod: 'post' as const,
          },
        },
      }),
    }

    await context.agent.emit(OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED, {
      contactId: contact.id,
      identity,
    })
    logger.log(`Contact added: ${correlationId}`)

    return context.agent.cmAddIdentity({ contactId: contact.id, identity })
  }

  private async oid4vciHolderGetIssuerBranding(
    args: GetIssuerBrandingArgs,
    context: RequiredContext,
  ): Promise<Array<IIssuerLocaleBranding | IBasicIssuerLocaleBranding>> {
    const { serverMetadata, contact } = args

    // Here we are fetching issuer branding for a contact. If no contact is found that means we encounter this contact for the first time. This also means we do not have any branding for the contact.
    const issuerCorrelationId = contact?.identities
      .filter((identity) => identity.roles.includes(CredentialRole.ISSUER))
      .map((identity) => identity.identifier.correlationId)[0]

    if (issuerCorrelationId) {
      const branding = await context.agent.ibGetIssuerBranding({ filter: [{ issuerCorrelationId }] })
      if (branding.length > 0) {
        return branding[0].localeBranding
      }
    }

    // We should have serverMetadata in the context else something went wrong
    if (!serverMetadata) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    return getBasicIssuerLocaleBranding({
      display: serverMetadata.credentialIssuerMetadata?.display ?? [],
      dynamicRegistrationClientMetadata: serverMetadata.credentialIssuerMetadata,
      context,
    })
  }

  private async oid4vciHolderStoreIssuerBranding(args: StoreIssuerBrandingArgs, context: RequiredContext): Promise<void> {
    const { issuerBranding, contact } = args
    if (!issuerBranding || issuerBranding.length === 0 || (<Array<IIssuerLocaleBranding>>issuerBranding)[0].id) {
      // FIXME we need better separation between a contact(issuer) we encountered before and it's branding vs a new contact and it's branding
      return
    }

    if (!contact) {
      return Promise.reject(Error('Missing contact in context'))
    }

    const issuerCorrelationId = contact?.identities
      .filter((identity) => identity.roles.includes(CredentialRole.ISSUER))
      .map((identity) => identity.identifier.correlationId)[0]

    // we check for issuer branding as adding an identity might also trigger storing the issuer branding
    const branding = await context.agent.ibGetIssuerBranding({ filter: [{ issuerCorrelationId }] })
    if (branding.length > 0) {
      return
    }

    await context.agent.ibAddIssuerBranding({
      localeBranding: issuerBranding as Array<IBasicIssuerLocaleBranding>,
      issuerCorrelationId,
    })
  }

  private async oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<VerificationResult[]> {
    const { credentialsToAccept, issuanceOpt } = args

    return await Promise.all(
      credentialsToAccept.map((credentialToAccept) =>
        verifyCredentialToAccept({
          mappedCredential: credentialToAccept,
          onVerifyEBSICredentialIssuer: this.onVerifyEBSICredentialIssuer,
          hasher: this.hasher,
          schemaValidation: issuanceOpt?.schemaValidation,
          context,
        }),
      ),
    )
  }

  private async oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void> {
    const { credentialBranding, serverMetadata, selectedCredentials, credentialsToAccept } = args

    if (serverMetadata === undefined) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    } else if (selectedCredentials.length === 0) {
      logger.warning(`No credentials selected for issuer: ${serverMetadata.issuer}`)
      return
    }

    let counter = 0
    for (const credentialId of selectedCredentials) {
      // The selectedCredential from context is the configurationId, whilst we store the branding by type. We need to map
      const configId = credentialId
      const types =
        credentialsToAccept
          .find((ac) => ac.correlationId === configId || ac.credentialToAccept.id === configId || ac.types.includes(configId))
          ?.types?.filter((type) => type != 'VerifiableCredential') ?? []

      const localeBranding: Array<IBasicCredentialLocaleBranding> = credentialBranding?.[configId] ?? []
      if (localeBranding.length === 0) {
        for (const type of types) {
          const branding = credentialBranding?.[type] ?? []
          if (branding.length > 0) {
            localeBranding.push(...branding)
          }
        }
      }

      if (localeBranding && localeBranding.length > 0) {
        const credential = credentialsToAccept.find(
          (credAccept) =>
            credAccept.credentialToAccept.id === credentialId ||
            JSON.stringify(credAccept.types) === credentialId ||
            JSON.stringify(credAccept.types.filter((cred) => cred !== 'VerifiableCredential')) === JSON.stringify(types) ||
            credentialsToAccept[counter],
        )!
        counter++
        await context.agent.ibAddCredentialBranding({
          vcHash: computeEntryHash(credential.rawVerifiableCredential as W3CVerifiableCredential),
          issuerCorrelationId: new URL(serverMetadata.issuer).hostname,
          localeBranding,
        })
        logger.log(
          `Credential branding for issuer ${serverMetadata.issuer} and type ${credentialId} stored with locales ${localeBranding.map((b) => b.locale).join(',')}`,
        )
      } else {
        logger.warning(`No credential branding found for issuer: ${serverMetadata.issuer} and type ${credentialId}`)
      }
    }
  }

  private async oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void> {
    function trimmed(input?: string) {
      const trim = input?.trim()
      if (trim === '') {
        return undefined
      }
      return trim
    }

    const { credentialsToAccept, openID4VCIClientState, credentialsSupported, serverMetadata, selectedCredentials } = args
    const mappedCredentialToAccept = credentialsToAccept[0]

    if (selectedCredentials && selectedCredentials.length > 1) {
      logger.error(`More than 1 credential selected ${selectedCredentials.join(', ')}, but current service only stores 1 credential!`)
    }

    // TODO determine when and how we should store credentials without key kmsKeyRef & id method), this should be tested with the code below
    const issuanceOpt = args.issuanceOpt ?? mappedCredentialToAccept.credentialToAccept.issuanceOpt
    if (!issuanceOpt || !issuanceOpt.identifier) {
      return Promise.reject(Error('issuanceOpt.identifier must me set in order to store a credential'))
    }
    const { kmsKeyRef, method } = issuanceOpt.identifier

    let persist = true
    const verifiableCredential = mappedCredentialToAccept.uniformVerifiableCredential as VerifiableCredential

    const notificationId = mappedCredentialToAccept.credentialToAccept.credentialResponse.notification_id
    const subjectIssuance = mappedCredentialToAccept.credential_subject_issuance
    const notificationEndpoint = serverMetadata?.credentialIssuerMetadata?.notification_endpoint
    let holderCredential:
      | IVerifiableCredential
      | JwtDecodedVerifiableCredential
      | SdJwtDecodedVerifiableCredentialPayload
      | W3CVerifiableCredential
      | undefined = undefined
    if (!notificationEndpoint) {
      logger.log(`Notifications not supported by issuer ${serverMetadata?.issuer}. Will not provide a notification`)
    } else if (notificationEndpoint && !notificationId) {
      logger.warning(
        `Notification endpoint available in issuer metadata with value ${notificationEndpoint}, but no ${notificationId} provided. Will not send a notification to issuer ${serverMetadata?.issuer}`,
      )
    } else if (notificationEndpoint && notificationId) {
      logger.log(`Notification id ${notificationId} found, will send back a notification to ${notificationEndpoint}`)
      let event = 'credential_accepted'
      if (Array.isArray(subjectIssuance?.notification_events_supported)) {
        // experimental subject issuance, where a new credential is being created
        event = subjectIssuance.notification_events_supported.includes('credential_accepted_holder_signed')
          ? 'credential_accepted_holder_signed'
          : 'credential_deleted_holder_signed'
        logger.log(`Subject issuance/signing will be used, with event`, event)

        const issuerVC = extractCredentialFromResponse(mappedCredentialToAccept.credentialToAccept.credentialResponse)
        const wrappedIssuerVC = CredentialMapper.toWrappedVerifiableCredential(issuerVC, { hasher: this.hasher ?? defaultHasher })
        console.log(`Wrapped VC: ${wrappedIssuerVC.type}, ${wrappedIssuerVC.format}`)
        // We will use the subject of the VCI Issuer (the holder, as the issuer of the new credential, so the below is not a mistake!)

        let issuer: string | undefined

        if (CredentialMapper.isWrappedSdJwtVerifiableCredential(wrappedIssuerVC)) {
          issuer = trimmed(wrappedIssuerVC.decoded?.sub)
        } else if (CredentialMapper.isWrappedW3CVerifiableCredential(wrappedIssuerVC)) {
          issuer =
            trimmed(wrappedIssuerVC.credential?.sub) ??
            // @ts-ignore
            trimmed(wrappedIssuerVC.credential?.credentialSubject?.id) ??
            trimmed(this.idFromW3cCredentialSubject(wrappedIssuerVC))
        } else if (CredentialMapper.isWrappedMdocCredential(wrappedIssuerVC)) {
          return Promise.reject(Error('mdoc not yet supported'))
        }

        if (!issuer) {
          issuer = trimmed(verifiableCredential.credentialSubject?.id)
        }
        if (!issuer && openID4VCIClientState?.kid?.startsWith('did:')) {
          issuer = parseDid(openID4VCIClientState?.kid).did
        }
        if (!issuer && openID4VCIClientState?.jwk?.kid?.startsWith('did:')) {
          issuer = parseDid(openID4VCIClientState!.jwk!.kid!).did
        }
        if (!issuer && openID4VCIClientState?.clientId) {
          issuer = trimmed(openID4VCIClientState.clientId)
        }
        if (!issuer && openID4VCIClientState?.accessTokenResponse) {
          const decodedJwt = decodeJWT(openID4VCIClientState.accessTokenResponse.access_token)
          issuer = decodedJwt.payload.sub
        }
        if (!issuer && mappedCredentialToAccept.credentialToAccept.issuanceOpt.identifier) {
          const resolution = await context.agent.identifierManagedGet(mappedCredentialToAccept.credentialToAccept.issuanceOpt.identifier)
          issuer = resolution.issuer
        }

        if (!issuer) {
          throw Error(`We could not determine the issuer, which means we cannot sign the credential`)
        }
        logger.log(`Issuer for self-issued credential will be: ${issuer}`)

        const holderCredentialToSign = wrappedIssuerVC.decoded
        let proofFormat: CredentialProofFormat = 'lds'
        if (wrappedIssuerVC.format.includes('jwt') && !wrappedIssuerVC.format.includes('mso_mdoc')) {
          holderCredentialToSign.iss = issuer
          proofFormat = 'jwt'
        }
        if ('issuer' in holderCredentialToSign && !('iss' in holderCredentialToSign)) {
          holderCredentialToSign.issuer = issuer
        }
        if ('sub' in holderCredentialToSign) {
          holderCredentialToSign.sub = issuer
        }
        if ('credentialSubject' in holderCredentialToSign && !Array.isArray(holderCredentialToSign.credentialSubject)) {
          holderCredentialToSign.credentialSubject.id = issuer
        }
        if ('vc' in holderCredentialToSign) {
          if (holderCredentialToSign.vc.credentialSubject) {
            holderCredentialToSign.vc.credentialSubject.id = issuer
          }
          holderCredentialToSign.vc.issuer = issuer
          delete holderCredentialToSign.vc.proof
          delete holderCredentialToSign.vc.issuanceDate
        }
        delete holderCredentialToSign.proof
        delete holderCredentialToSign.issuanceDate
        delete holderCredentialToSign.iat

        logger.log(`Subject issuance/signing will sign credential of type ${proofFormat}:`, holderCredentialToSign)
        const issuedVC = await context.agent.createVerifiableCredential({
          credential: ('vc' in holderCredentialToSign ? holderCredentialToSign.vc : holderCredentialToSign) as CredentialPayload,
          fetchRemoteContexts: true,
          save: false,
          proofFormat,
        })
        if (!issuedVC) {
          throw Error(`Could not issue holder credential from the wallet`)
        }
        logger.log(`Holder ${issuedVC.issuer} issued new credential with id ${issuedVC.id}`, issuedVC)
        holderCredential = CredentialMapper.storedCredentialToOriginalFormat(issuedVC as IVerifiableCredential)
        persist = event === 'credential_accepted_holder_signed'
      }

      const notificationRequest: NotificationRequest = {
        notification_id: notificationId,
        ...(holderCredential && { credential: holderCredential }),
        event,
      }

      await this.oid4vciHolderSendNotification(
        {
          openID4VCIClientState,
          stored: persist,
          credentialsToAccept,
          credentialsSupported,
          notificationRequest,
          serverMetadata,
        },
        context,
      )
    }
    const persistCredential = holderCredential
      ? CredentialMapper.storedCredentialToOriginalFormat(holderCredential)
      : mappedCredentialToAccept.rawVerifiableCredential
    if (!persist && holderCredential) {
      logger.log(`Will not persist credential, since we are signing as a holder and the issuer asked not to persist`)
    } else {
      logger.log(`Persisting credential`, persistCredential)

      const issuer = CredentialMapper.issuerCorrelationIdFromIssuerType(verifiableCredential.issuer)
      const [subjectCorrelationType, subjectCorrelationId] = this.determineSubjectCorrelation(issuanceOpt.identifier, issuer)

      const persistedCredential = await context.agent.crsAddCredential({
        credential: {
          rawDocument: ensureRawDocument(persistCredential),
          kmsKeyRef: kmsKeyRef,
          identifierMethod: method,
          credentialRole: CredentialRole.HOLDER,
          issuerCorrelationType: issuer?.startsWith('did:') ? CredentialCorrelationType.DID : CredentialCorrelationType.URL,
          issuerCorrelationId: issuer,
          subjectCorrelationType,
          subjectCorrelationId,
        },
      })
      await context.agent.emit(OID4VCIHolderEvent.CREDENTIAL_STORED, {
        credential: persistedCredential,
        vcHash: persistedCredential.hash,
      } satisfies OnCredentialStoredArgs)
    }
  }

  private async oid4vciHolderSendNotification(args: SendNotificationArgs, context: RequiredContext): Promise<void> {
    const { serverMetadata, notificationRequest, openID4VCIClientState } = args
    const notificationEndpoint = serverMetadata?.credentialIssuerMetadata?.notification_endpoint
    if (!notificationEndpoint) {
      return
    } else if (!openID4VCIClientState) {
      return Promise.reject(Error('Missing openID4VCI client state in context'))
    } else if (!notificationRequest) {
      return Promise.reject(Error('Missing notification request'))
    }

    logger.log(`Will send notification to ${notificationEndpoint}`, notificationRequest)

    const client = await OpenID4VCIClient.fromState({ state: openID4VCIClientState })
    await client.sendNotification({ notificationEndpoint }, notificationRequest, openID4VCIClientState?.accessTokenResponse?.access_token)
    logger.log(`Notification to ${notificationEndpoint} has been dispatched`)
  }

  private async getFederationTrust(args: GetFederationTrustArgs, context: RequiredContext): Promise<Array<string>> {
    const { requestData, serverMetadata, trustAnchors } = args

    if (trustAnchors.length === 0) {
      return Promise.reject(Error('No trust anchors found'))
    }

    if (!requestData?.uri) {
      return Promise.reject(Error('Missing request URI in context'))
    }

    if (!serverMetadata) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    const url = new URL(requestData?.uri)
    const params = new URLSearchParams(url.search)
    const openidFederation = params.get('openid_federation')
    const entityIdentifier = openidFederation ?? serverMetadata.issuer
    if (entityIdentifier.startsWith('http://')) {
      console.warn(`OpenID federation does not support http://, only https:// allowed; got: (${url.toString()})`)
      // OIDF always needs to be https
      return []
    }

    const result = await context.agent.identifierExternalResolveByOIDFEntityId({
      method: 'entity_id',
      trustAnchors: trustAnchors,
      identifier: entityIdentifier,
    })

    return result.trustedAnchors
  }

  private async oid4vciHolderGetIssuerMetadata(args: GetIssuerMetadataArgs, context: RequiredContext): Promise<EndpointMetadataResult> {
    const { issuer, errorOnNotFound = true } = args
    return MetadataClient.retrieveAllMetadata(issuer, { errorOnNotFound })
  }

  private determineSubjectCorrelation(identifier: ManagedIdentifierOptsOrResult, issuer: string): [CredentialCorrelationType, string] {
    switch (identifier.method) {
      case 'did':
        if (isManagedIdentifierResult(identifier) && isManagedIdentifierDidResult(identifier)) {
          return [CredentialCorrelationType.DID, identifier.did]
        } else if (isManagedIdentifierDidOpts(identifier)) {
          return [CredentialCorrelationType.DID, typeof identifier.identifier === 'string' ? identifier.identifier : identifier.identifier.did]
        }
        break
      case 'kid':
        if (isManagedIdentifierResult(identifier) && isManagedIdentifierKidResult(identifier)) {
          return [CredentialCorrelationType.KID, identifier.kid]
        } else if (isManagedIdentifierDidOpts(identifier)) {
          return [CredentialCorrelationType.KID, identifier.identifier]
        }
        break
      case 'x5c':
        if (isManagedIdentifierResult(identifier) && isManagedIdentifierX5cResult(identifier)) {
          return [CredentialCorrelationType.X509_SAN, identifier.x5c.join('\r\n')]
        } else if (isManagedIdentifierX5cOpts(identifier)) {
          return [CredentialCorrelationType.X509_SAN, identifier.identifier.join('\r\n')]
        }
        break
    }
    return [CredentialCorrelationType.URL, issuer]
  }

  private idFromW3cCredentialSubject(wrappedIssuerVC: WrappedW3CVerifiableCredential): string | undefined {
    if (Array.isArray(wrappedIssuerVC.credential?.credentialSubject)) {
      if (wrappedIssuerVC.credential?.credentialSubject.length > 0) {
        return wrappedIssuerVC.credential?.credentialSubject[0].id
      }
    } else {
      return wrappedIssuerVC.credential?.credentialSubject?.id
    }
    return undefined
  }

  private getCredentialDefinition(issuanceOpt: IssuanceOpts): CredentialDefinitionJwtVcJsonLdAndLdpVcV1_0_15 | undefined {
    if (issuanceOpt.format == 'ldp_vc' || issuanceOpt.format == 'jwt_vc_json-ld') {
      return (issuanceOpt as CredentialConfigurationSupportedJwtVcJsonLdAndLdpVcV1_0_15).credential_definition
    }
    return undefined
  }
}
