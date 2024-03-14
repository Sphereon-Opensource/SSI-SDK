import {OpenID4VCIClient} from '@sphereon/oid4vci-client'
import {CredentialSupported, DefaultURISchemes} from '@sphereon/oid4vci-common'
import {
  CorrelationIdentifierEnum,
  CredentialRole,
  IBasicCredentialLocaleBranding,
  Identity,
  IdentityOrigin,
  NonPersistedIdentity,
  Party,
} from '@sphereon/ssi-sdk.data-store'
import {IAgentPlugin, VerifiableCredential} from '@veramo/core'
import {computeEntryHash} from '@veramo/utils'
import {v4 as uuidv4} from 'uuid'
import {OID4VCIMachine} from '../machine/oid4vciMachine'
import {
  AddContactIdentityArgs,
  AssertValidCredentialsArgs,
  CreateCredentialSelectionArgs,
  CredentialToAccept,
  CredentialTypeSelection,
  GetContactArgs,
  GetCredentialsArgs,
  InitiateOID4VCIArgs,
  InitiationData,
  IOID4VCIHolder,
  MappedCredentialToAccept,
  OID4VCIHolderEvent,
  OID4VCIHolderOptions,
  OID4VCIMachine as OID4VCImachineId,
  OID4VCIMachineInstanceOpts,
  OnContactIdentityCreatedArgs,
  OnCredentialStoredArgs,
  OnGetCredentialsArgs,
  RequestType,
  RequiredContext,
  StoreCredentialBrandingArgs,
  StoreCredentialsArgs,
} from '../types/IOID4VCIHolder'
import {
  getCredentialBranding,
  getSupportedCredentials,
  mapCredentialToAccept,
  selectCredentialLocaleBranding,
  verifyCredentialToAccept,
} from './OID4VCIHolderService'

/**
 * {@inheritDoc IOID4VCIHolder}
 */

export class OID4VCIHolder implements IAgentPlugin {
  readonly eventTypes: Array<OID4VCIHolderEvent> = [OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED, OID4VCIHolderEvent.CREDENTIAL_STORED]

  readonly methods: IOID4VCIHolder = {
    oid4vciHolderGetMachineInterpreter: this.oid4vciHolderGetMachineInterpreter.bind(this),
    oid4vciHolderGetInitiationData: this.oid4vciHolderGetCredentialOfferData.bind(this),
    oid4vciHolderCreateCredentialSelection: this.oid4vciHolderCreateCredentialSelection.bind(this),
    oid4vciHolderGetContact: this.oid4vciHolderGetContact.bind(this),
    oid4vciHolderGetCredentials: this.oid4vciHolderGetCredentials.bind(this),
    oid4vciHolderAddContactIdentity: this.oid4vciHolderAddContactIdentity.bind(this),
    oid4vciHolderAssertValidCredentials: this.oid4vciHolderAssertValidCredentials.bind(this),
    oid4vciHolderStoreCredentialBranding: this.oid4vciHolderStoreCredentialBranding.bind(this),
    oid4vciHolderStoreCredentials: this.oid4vciHolderStoreCredentials.bind(this),
  }

  private readonly vcFormatPreferences: Array<string> = ['jwt_vc_json', 'jwt_vc', 'ldp_vc']
  private readonly onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  private readonly onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  private readonly onGetCredentials: (args: OnGetCredentialsArgs) => Promise<Array<CredentialToAccept>>

  constructor(options: OID4VCIHolderOptions) {
    const { onContactIdentityCreated, onCredentialStored, onGetCredentials, vcFormatPreferences } = options

    if (vcFormatPreferences !== undefined && vcFormatPreferences.length > 0) {
      this.vcFormatPreferences = vcFormatPreferences
    }
    this.onGetCredentials = onGetCredentials
    this.onContactIdentityCreated = onContactIdentityCreated
    this.onCredentialStored = onCredentialStored
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case OID4VCIHolderEvent.CONTACT_IDENTITY_CREATED:
        this.onContactIdentityCreated?.(event.data)
        break
      case OID4VCIHolderEvent.CREDENTIAL_STORED:
        this.onCredentialStored?.(event.data)
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  /**
   * FIXME: This method can only be used locally. Creating the interpreter should be local to where the agent is running
   */
  private async oid4vciHolderGetMachineInterpreter(args: OID4VCIMachineInstanceOpts, context: RequiredContext): Promise<OID4VCImachineId> {
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

    const { machineStateInit, interpreter } = await OID4VCIMachine.newInstance(oid4vciMachineInstanceArgs, context)

    return {
      machineStateInit,
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
    const credentialsSupported = await getSupportedCredentials({ openID4VCIClient, vcFormatPreferences: this.vcFormatPreferences })
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
    context: RequiredContext
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
        const localeBranding = credentialBranding?.get(credentialType)
        const credentialAlias = (await selectCredentialLocaleBranding({ locale, localeBranding }))?.alias

        return {
          id: uuidv4(),
          credentialType,
          credentialAlias: credentialAlias ?? credentialType,
          isSelected: false,
        }
      })
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
              origin: IdentityOrigin.EXTRERNAL,
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
    const { verificationCode, selectedCredentials, openID4VCIClientState } = args

    if (!openID4VCIClientState) {
      throw Error('Missing openID4VCI client state in context')
    }

    return this.onGetCredentials({
      credentials: selectedCredentials,
      pin: verificationCode,
      openID4VCIClientState,
    }).then((credentials: Array<CredentialToAccept>) => mapCredentialToAccept({ credentials }))
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
      origin: IdentityOrigin.EXTRERNAL,
      roles: [CredentialRole.ISSUER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
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
        async (mappedCredential: MappedCredentialToAccept): Promise<void> => verifyCredentialToAccept({ mappedCredential, context })
      )
    )
  }

  private async oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void> {
    const { credentialBranding, serverMetadata, selectedCredentials, credentialsToAccept } = args

    if (serverMetadata === undefined) {
      return Promise.reject(Error('Missing serverMetadata in context'))
    }

    const localeBranding: Array<IBasicCredentialLocaleBranding> | undefined = credentialBranding?.get(selectedCredentials[0])
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
