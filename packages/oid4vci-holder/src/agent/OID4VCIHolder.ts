import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import { CredentialSupported, DefaultURISchemes, Jwt, ProofOfPossessionCallbacks } from '@sphereon/oid4vci-common'
import {
  CorrelationIdentifierType,
  IBasicCredentialLocaleBranding,
  Identity,
  IdentityRole,
  NonPersistedIdentity,
  Party
} from '@sphereon/ssi-sdk.data-store'
import { DIDDocument, IAgentPlugin, VerifiableCredential } from '@veramo/core'
import { computeEntryHash } from '@veramo/utils'
import { JWTHeader } from 'did-jwt'
import { v4 as uuidv4 } from 'uuid'
import { OID4VCIMachine } from '../machine/oid4vciMachine'
import {
  getCredentialBranding,
  getCredentialsSupported,
  getIdentifier,
  getIssuanceOpts,
  getSupportedCredentials,
  mapCredentialToAccept,
  selectCredentialLocaleBranding,
  signatureAlgorithmFromKey,
  signJWT,
  verifyCredentialToAccept,
} from './OID4VCIHolderService'
import {
  AddContactIdentityArgs,
  AssertValidCredentialsArgs,
  CreateCredentialSelectionArgs,
  CredentialTypeSelection,
  GetContactArgs,
  GetCredentialArgs,
  GetCredentialsArgs,
  InitiateOID4VCIArgs,
  InitiationData,
  IOID4VCIHolder,
  IssuanceOpts,
  MappedCredentialToAccept,
  OID4VCIHolderEvent,
  OID4VCIHolderOptions,
  OID4VCIMachine as OID4VCIMachineId,
  OID4VCIMachineInstanceOpts,
  OnContactIdentityCreatedArgs,
  OnCredentialStoredArgs,
  OnIdentifierCreatedArgs,
  RequestType,
  RequiredContext,
  SignatureAlgorithmEnum,
  StoreCredentialBrandingArgs,
  StoreCredentialsArgs,
  SupportedDidMethodEnum,
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

export class OID4VCIHolder implements IAgentPlugin {
  readonly eventTypes: Array<OID4VCIHolderEvent> = [
    OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED,
    OID4VCIHolderEvent.CREDENTIAL_STORED,
    OID4VCIHolderEvent.IDENTIFIER_CREATED,
  ]

  readonly methods: IOID4VCIHolder = {
    oid4vciHolderGetMachineInterpreter: this.oid4vciHolderGetMachineInterpreter.bind(this),
    oid4vciHolderGetInitiationData: this.oid4vciHolderGetCredentialOfferData.bind(this),
    oid4vciHolderCreateCredentialSelection: this.oid4vciHolderCreateCredentialSelection.bind(this),
    oid4vciHolderGetContact: this.oid4vciHolderGetContact.bind(this),
    oid4vciHolderGetCredentials: this.oid4vciHolderGetCredentials.bind(this),
    oid4vciHolderGetCredential: this.oid4vciHolderGetCredential.bind(this),
    oid4vciHolderAddContactIdentity: this.oid4vciHolderAddContactIdentity.bind(this),
    oid4vciHolderAssertValidCredentials: this.oid4vciHolderAssertValidCredentials.bind(this),
    oid4vciHolderStoreCredentialBranding: this.oid4vciHolderStoreCredentialBranding.bind(this),
    oid4vciHolderStoreCredentials: this.oid4vciHolderStoreCredentials.bind(this),
  }

  private readonly vcFormatPreferences: Array<string> = ['jwt_vc_json', 'jwt_vc', 'ldp_vc']
  private readonly jsonldCryptographicSuitePreferences: Array<string> = [
    'Ed25519Signature2018',
    'EcdsaSecp256k1Signature2019',
    'Ed25519Signature2020',
    'JsonWebSignature2020',
    // "JcsEd25519Signature2020"
  ]
  private readonly didMethodPreferences: Array<SupportedDidMethodEnum> = [
    SupportedDidMethodEnum.DID_KEY,
    SupportedDidMethodEnum.DID_JWK,
    SupportedDidMethodEnum.DID_ION,
  ]
  private readonly jwtCryptographicSuitePreferences: Array<SignatureAlgorithmEnum> = [
    SignatureAlgorithmEnum.ES256,
    SignatureAlgorithmEnum.ES256K,
    SignatureAlgorithmEnum.EdDSA,
  ]
  private readonly onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  private readonly onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  private readonly onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>

  constructor(options?: OID4VCIHolderOptions) {
    const {
      onContactIdentityCreated,
      onCredentialStored,
      onIdentifierCreated,
      vcFormatPreferences,
      jsonldCryptographicSuitePreferences,
      didMethodPreferences,
      jwtCryptographicSuitePreferences,
    } = options ?? {}

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
    this.onContactIdentityCreated = onContactIdentityCreated
    this.onCredentialStored = onCredentialStored
    this.onIdentifierCreated = onIdentifierCreated
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
  private async oid4vciHolderGetMachineInterpreter(args: OID4VCIMachineInstanceOpts, context: RequiredContext): Promise<OID4VCIMachineId> {
    const services = {
      initiateOID4VCI: (args: InitiateOID4VCIArgs) => this.oid4vciHolderGetCredentialOfferData(args, context),
      createCredentialSelection: (args: CreateCredentialSelectionArgs) => this.oid4vciHolderCreateCredentialSelection(args, context),
      getContact: (args: GetContactArgs) => this.oid4vciHolderGetContact(args, context),
      getCredentials: (args: GetCredentialsArgs) => this.oid4vciHolderGetCredentials(args, context),
      addContactIdentity: (args: AddContactIdentityArgs) => this.oid4vciHolderAddContactIdentity(args, context),
      assertValidCredentials: (args: AssertValidCredentialsArgs) => this.oid4vciHolderAssertValidCredentials(args, context),
      storeCredentialBranding: (args: StoreCredentialBrandingArgs) => this.oid4vciHolderStoreCredentialBranding(args, context),
      storeCredentials: (args: StoreCredentialsArgs) => this.oid4vciHolderStoreCredentials(args, context),
    }

    const oid4vciMachineInstanceArgs: OID4VCIMachineInstanceOpts = {
      ...args,
      services: {
        ...services,
        ...args.services,
      },
    }

    const { interpreter } = await OID4VCIMachine.newInstance(oid4vciMachineInstanceArgs, context)

    return {
      interpreter,
    }
  }

  private async oid4vciHolderGetCredentialOfferData(args: InitiateOID4VCIArgs, context: RequiredContext): Promise<InitiationData> {
    const { requestData } = args

    if (requestData?.uri === undefined) {
      return Promise.reject(Error('Missing request URI in context'))
    }

    if (
      !requestData?.uri ||
      !(requestData?.uri.startsWith(RequestType.OPENID_INITIATE_ISSUANCE) || requestData?.uri.startsWith(RequestType.OPENID_CREDENTIAL_OFFER))
    ) {
      return Promise.reject(Error(`Invalid OID4VCI credential offer URI: ${requestData?.uri}`))
    }

    const openID4VCIClient = await OpenID4VCIClient.fromURI({
      uri: requestData?.uri,
      // TODO: It would be nice to be able to configure the plugin with a custom redirect URI, mainly for mobile
      authorizationRequest: { redirectUri: `${DefaultURISchemes.CREDENTIAL_OFFER}://` },
    })

    const serverMetadata = await openID4VCIClient.retrieveServerMetadata()
    const credentialsSupported = await getSupportedCredentials({
      openID4VCIClient,
      vcFormatPreferences: this.vcFormatPreferences,
    })
    const credentialBranding = await getCredentialBranding({ credentialsSupported, context })
    const authorizationCodeURL = openID4VCIClient.authorizationURL
    const openID4VCIClientState = JSON.parse(await openID4VCIClient.exportState())

    return {
      authorizationCodeURL,
      credentialBranding,
      credentialsSupported,
      serverMetadata,
      openID4VCIClientState,
    }
  }

  private async oid4vciHolderCreateCredentialSelection(
    args: CreateCredentialSelectionArgs,
    context: RequiredContext,
  ): Promise<Array<CredentialTypeSelection>> {
    const { credentialsSupported, credentialBranding, locale, selectedCredentials } = args
    const credentialSelection: Array<CredentialTypeSelection> = await Promise.all(
      credentialsSupported.map(async (credentialMetadata: CredentialSupported): Promise<CredentialTypeSelection> => {
        if (!('types' in credentialMetadata)) {
          return Promise.reject(Error('SD-JWT not supported yet'))
        }
        // FIXME this allows for duplicate VerifiableCredential, which the user has no idea which ones those are and we also have a branding map with unique keys, so some branding will not match
        const defaultCredentialType = 'VerifiableCredential'
        const credentialType = credentialMetadata.types.find((type: string): boolean => type !== defaultCredentialType) ?? defaultCredentialType
        const localeBranding = credentialBranding?.[credentialType]
        const credentialAlias = (
          await selectCredentialLocaleBranding({
            locale,
            localeBranding,
          })
        )?.alias

        return {
          id: uuidv4(),
          credentialType,
          credentialAlias: credentialAlias ?? credentialType,
          isSelected: false,
        }
      }),
    )

    // TODO find better place to do this, would be nice if the machine does this?
    if (credentialSelection.length === 1) {
      selectedCredentials.push(credentialSelection[0].credentialType)
    }

    return credentialSelection
  }

  private async oid4vciHolderGetContact(args: GetContactArgs, context: RequiredContext): Promise<Party | undefined> {
    const { serverMetadata } = args

    if (serverMetadata === undefined) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    const correlationId: string = new URL(serverMetadata.issuer).hostname
    return context.agent
      .cmGetContacts({
        filter: [
          {
            identities: {
              identifier: {
                correlationId,
              },
            },
          },
        ],
      })
      .then((contacts: Array<Party>): Party | undefined => (contacts.length === 1 ? contacts[0] : undefined))
  }

  private async oid4vciHolderGetCredentials(args: GetCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept>> {
    const { verificationCode, openID4VCIClientState } = args

    if (!openID4VCIClientState) {
      return Promise.reject(Error('Missing openID4VCI client state in context'))
    }

    const client = await OpenID4VCIClient.fromState({ state: openID4VCIClientState })
    const credentialsSupported = await getCredentialsSupported({ client, vcFormatPreferences: this.vcFormatPreferences })
    const serverMetadata = await client.retrieveServerMetadata()
    const issuanceOpts = await getIssuanceOpts({
      client,
      credentialsSupported,
      serverMetadata,
      context,
      didMethodPreferences: this.didMethodPreferences,
      jwtCryptographicSuitePreferences: this.jwtCryptographicSuitePreferences,
      jsonldCryptographicSuitePreferences: this.jsonldCryptographicSuitePreferences,
    })

    const getCredentials = issuanceOpts.map(
      async (issuanceOpt: IssuanceOpts): Promise<MappedCredentialToAccept> =>
        await this.oid4vciHolderGetCredential(
          {
            issuanceOpt,
            pin: verificationCode,
            client,
          },
          context,
        ),
    )

    return await Promise.all(getCredentials)
  }

  private async oid4vciHolderGetCredential(args: GetCredentialArgs, context: RequiredContext): Promise<MappedCredentialToAccept> {
    const { issuanceOpt, pin, client } = args

    if (!issuanceOpt) {
      return Promise.reject(Error(`Cannot get credential issuance options`))
    }
    const { identifier, key, kid } = await getIdentifier({ issuanceOpt, context })
    const alg: SignatureAlgorithmEnum = await signatureAlgorithmFromKey({ key })

    const callbacks: ProofOfPossessionCallbacks<DIDDocument> = {
      signCallback: (jwt: Jwt, kid?: string) => {
        let iss = jwt.payload.iss
        if (client.isEBSI()) {
          iss = jwt.header.kid?.split('#')[0]
        }
        if (!iss) {
          iss = jwt.header.kid?.split('#')[0]
        }
        if (!iss) {
          return Promise.reject(Error(`No issuer could be determined from the JWT ${JSON.stringify(jwt)}`))
        }
        const header = { ...jwt.header, kid } as Partial<JWTHeader>
        const payload = { ...jwt.payload, ...(iss && { iss }) }
        return signJWT({
          identifier,
          header,
          payload,
          options: { issuer: iss, expiresIn: jwt.payload.exp, canonicalize: false },
          context,
        })
      },
    }

    try {
      // We need to make sure we have acquired the access token
      if (!client.clientId) {
        client.clientId = issuanceOpt.identifier.did
      }
      await client.acquireAccessToken({
        clientId: client.clientId,
        pin,
        authorizationResponse: JSON.parse(await client.exportState()).authorizationCodeResponse,
      })
      // @ts-ignore
      const credentialResponse = await client.acquireCredentials({
        // @ts-ignore
        credentialTypes: issuanceOpt.types /*.filter((type: string): boolean => type !== 'VerifiableCredential')*/,
        ...('@context' in issuanceOpt && issuanceOpt['@context'] && { context: issuanceOpt['@context'] }),
        proofCallbacks: callbacks,
        format: issuanceOpt.format,
        // TODO: We need to update the machine and add notifications support for actual deferred credentials instead of just waiting/retrying
        deferredCredentialAwait: true,
        kid,
        alg,
        jti: uuidv4(),
      })

      const credential = {
        id: issuanceOpt.id,
        issuanceOpt,
        credentialResponse,
      }
      return mapCredentialToAccept({ credential })
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

    const correlationId: string = credentialsToAccept[0].correlationId
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRole.ISSUER],
      identifier: {
        type: CorrelationIdentifierType.DID,
        correlationId,
      },
    }

    await context.agent.emit(OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED, {
      contactId: contact.id,
      identity,
    })

    return context.agent.cmAddIdentity({ contactId: contact.id, identity })
  }

  private async oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<void> {
    const { credentialsToAccept } = args

    await Promise.all(
      credentialsToAccept.map(
        async (mappedCredential: MappedCredentialToAccept): Promise<void> =>
          verifyCredentialToAccept({
            mappedCredential,
            context,
          }),
      ),
    )
  }

  private async oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void> {
    const { credentialBranding, serverMetadata, selectedCredentials, credentialsToAccept } = args

    if (serverMetadata === undefined) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    const localeBranding: Array<IBasicCredentialLocaleBranding> | undefined = credentialBranding?.[selectedCredentials[0]]
    if (localeBranding && localeBranding.length > 0) {
      await context.agent.ibAddCredentialBranding({
        vcHash: computeEntryHash(credentialsToAccept[0].rawVerifiableCredential),
        issuerCorrelationId: new URL(serverMetadata.issuer).hostname,
        localeBranding,
      })
    }
  }

  private async oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void> {
    const { credentialsToAccept } = args

    const verifiableCredential = credentialsToAccept[0].uniformVerifiableCredential as VerifiableCredential
    const vcHash = await context.agent.dataStoreSaveVerifiableCredential({ verifiableCredential })

    await context.agent.emit(OID4VCIHolderEvent.CREDENTIAL_STORED, {
      vcHash,
      credential: verifiableCredential,
    })
  }
}
