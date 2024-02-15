import { schema } from '../index'
import { OpenID4VCIClient } from '@sphereon/oid4vci-client'
import { CredentialSupported,
  //DefaultURISchemes
} from '@sphereon/oid4vci-common'
import {
  CorrelationIdentifierEnum,
  IBasicCredentialLocaleBranding,
  Identity,
  IdentityRoleEnum,
  NonPersistedIdentity,
  Party
} from '@sphereon/ssi-sdk.data-store'
import { CredentialMapper, OriginalVerifiableCredential } from '@sphereon/ssi-types'
import { IAgentPlugin, VerifiableCredential } from '@veramo/core'
import { computeEntryHash } from '@veramo/utils'
import { v4 as uuidv4 } from 'uuid'
import { OID4VCIMachine } from '../machine/oid4vciMachine'
import {
  AddContactIdentityArgs,
  AssertValidCredentialsArgs,
  CreateCredentialSelectionArgs,
  CredentialTypeSelection,
  IOID4VCIHolder,
  InitiateDataArgs,
  InitiationData,
  MappedCredentialToAccept,
  OID4VCIHolderEvents,
  OID4VCIHolderOptions,
  OID4VCIMachineInstanceOpts,
  QrTypesEnum,
  RequiredContext,
  RetrieveContactArgs,
  RetrieveCredentialsArgs,
  StoreCredentialBrandingArgs,
  StoreCredentialsArgs,
  CredentialFromOffer,
  GetCredentialsArgs,
} from '../types/IOID4VCIHolder'
import {
  getCredentialBranding,
  getSupportedCredentials,
  mapCredentialToAccept,
  selectCredentialLocaleBranding,
  verifyCredentialToAccept
} from './OID4VCIHolderService'

/**
 * {@inheritDoc IOID4VCIHolder}
 */

export class OID4VCIHolder implements IAgentPlugin {
  readonly schema = schema.IOID4VCIHolder
  readonly eventTypes: Array<OID4VCIHolderEvents> = [
    OID4VCIHolderEvents.CONTACT_IDENTITY_CREATED,
    OID4VCIHolderEvents.CREDENTIAL_STORED
  ]

  readonly methods: IOID4VCIHolder = {
    oid4vciHolderGetMachineInterpreter: this.oid4vciHolderGetMachineInterpreter.bind(this),
    oid4vciHolderGetInitiationData: this.oid4vciHolderGetInitiationData.bind(this),
    oid4vciHolderCreateCredentialSelection: this.oid4vciHolderCreateCredentialSelection.bind(this),
    oid4vciHolderGetContact: this.oid4vciHolderGetContact.bind(this),
    oid4vciHolderGetCredentials: this.oid4vciHolderGetCredentials.bind(this),
    oid4vciHolderAddContactIdentity: this.oid4vciHolderAddContactIdentity.bind(this),
    oid4vciHolderAssertValidCredentials: this.oid4vciHolderAssertValidCredentials.bind(this),
    oid4vciHolderStoreCredentialBranding: this.oid4vciHolderStoreCredentialBranding.bind(this),
    oid4vciHolderStoreCredentials: this.oid4vciHolderStoreCredentials.bind(this),
  }

  private readonly vcFormatPreferences: Array<string> = ['jwt_vc_json', 'jwt_vc', 'ldp_vc']
  private readonly onContactIdentityCreated?: (identity: Identity) => Promise<void>
  private readonly onCredentialStored?: (credential: VerifiableCredential) => Promise<void>
  private readonly onGetCredentials: (args: GetCredentialsArgs) => Promise<Array<CredentialFromOffer>>

  constructor(options: OID4VCIHolderOptions) {
    const {
      onContactIdentityCreated,
      onCredentialStored,
      onGetCredentials,
      vcFormatPreferences
    } = options

    if (vcFormatPreferences !== undefined && vcFormatPreferences.length > 0) {
      this.vcFormatPreferences = vcFormatPreferences
    }
    this.onGetCredentials = onGetCredentials
    this.onContactIdentityCreated = onContactIdentityCreated
    this.onCredentialStored = onCredentialStored
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> { // TODO any
    switch (event.type) {
      case OID4VCIHolderEvents.CONTACT_IDENTITY_CREATED:
        this.onContactIdentityCreated?.(event.data)
        break
      case OID4VCIHolderEvents.CREDENTIAL_STORED:
        this.onCredentialStored?.(event.data)
        break
      default:
        return Promise.reject(Error('Event type not supported'))
    }
  }

  // TODO will not work for REST
  // TODO add options to override vcPreferences
  private async oid4vciHolderGetMachineInterpreter(args: OID4VCIMachineInstanceOpts, context: RequiredContext): Promise<Array<string>> { //OID4VCIMachineInterpreter
    const newArgs: OID4VCIMachineInstanceOpts = { // TODO refactor using services property
      ...args,
      initiateData: (args: InitiateDataArgs) => this.oid4vciHolderGetInitiationData(args, context), // TODO name of function
      createCredentialSelection: (args: CreateCredentialSelectionArgs) => this.oid4vciHolderCreateCredentialSelection(args, context),
      retrieveContact: (args: RetrieveContactArgs) => this.oid4vciHolderGetContact(args, context),
      retrieveCredentials: (args: RetrieveCredentialsArgs) => this.oid4vciHolderGetCredentials(args, context),
      addContactIdentity: (args: AddContactIdentityArgs) => this.oid4vciHolderAddContactIdentity(args, context),
      assertValidCredentials: (args: AssertValidCredentialsArgs) => this.oid4vciHolderAssertValidCredentials(args, context),
      storeCredentialBranding: (args: StoreCredentialBrandingArgs) => this.oid4vciHolderStoreCredentialBranding(args, context),
      storeCredentials: (args: StoreCredentialsArgs) => this.oid4vciHolderStoreCredentials(args, context)
    }

    const interpreter = OID4VCIMachine.newInstance(newArgs);
    interpreter.start()

    // TODO correct this mess
    return []
  }

  private async oid4vciHolderGetInitiationData(args: InitiateDataArgs, context: RequiredContext): Promise<InitiationData> { // TODO name
    const { requestData } = args;

    if (requestData?.uri === undefined) {
      return Promise.reject(Error('Missing request uri in context'));
    }

    if (!requestData?.uri || !(requestData?.uri.startsWith(QrTypesEnum.OPENID_INITIATE_ISSUANCE) || requestData?.uri.startsWith(QrTypesEnum.OPENID_CREDENTIAL_OFFER))) {
      return Promise.reject(Error('Invalid Uri'));
    }

    const openID4VCIClient= await OpenID4VCIClient.fromURI({
      uri: requestData?.uri,
      //authorizationRequest: {redirectUri: `${DefaultURISchemes.CREDENTIAL_OFFER}://`},
    })

    const serverMetadata = await openID4VCIClient.retrieveServerMetadata() //await getServerMetadata(openID4VCIClient)
    const credentialsSupported = await getSupportedCredentials(openID4VCIClient, this.vcFormatPreferences)
    const credentialBranding = await getCredentialBranding(credentialsSupported, context)
    const authorizationCodeURL = openID4VCIClient.authorizationURL // TODO do we still use this?
    const openID4VCIClientState =  await openID4VCIClient.exportState()

    return {
      authorizationCodeURL,
      credentialBranding,
      credentialsSupported,
      serverMetadata,
      openID4VCIClientState
    };
  }

  private async oid4vciHolderCreateCredentialSelection(args: CreateCredentialSelectionArgs, context: RequiredContext): Promise<Array<CredentialTypeSelection>> {
    const {credentialsSupported, credentialBranding, locale, selectedCredentials} = args;

    // TODO add guard for having credentials
    // if (!credentialsSupported) {
    //   return Promise.reject(Error('Missing initiationData in context'));
    // }

    // console.log('oid4vciHolderCreateCredentialSelection CALLED')
    // if (context) {
    //   console.log('oid4vciHolderCreateCredentialSelection CONTEXT FOUND')
    // }

    const credentialSelection: Array<CredentialTypeSelection> = await Promise.all(
      credentialsSupported.map(async (credentialMetadata: CredentialSupported): Promise<CredentialTypeSelection> => {
        if (!('types' in credentialMetadata)) {
          return Promise.reject(Error('SD-JWT not supported yet')) // TODO translation?
        }
        // FIXME this allows for duplicate VerifiableCredential, which the user has no idea which ones those are and we also have a branding map with unique keys, so some branding will not match
        const defaultCredentialType = 'VerifiableCredential'
        const credentialType = credentialMetadata.types.find((type: string) => type !== defaultCredentialType) ?? defaultCredentialType;
        const localeBranding = credentialBranding?.get(credentialType)  // TODO check ? at credentialBranding
        const credentialAlias = (await selectCredentialLocaleBranding({ locale, localeBranding }))?.alias

        return {
          id: uuidv4(),
          credentialType,
          credentialAlias: credentialAlias ?? credentialType,
          isSelected: false,
        };
      }),
    );

    // TODO find better place to do this, would be nice if the machine does this?
    if (credentialSelection.length === 1) {
      selectedCredentials.push(credentialSelection[0].credentialType);
    }

    return credentialSelection;
  }

  private async oid4vciHolderGetContact(args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined> {
    const { serverMetadata } = args;

    // if (!openId4VcIssuanceProvider) {
    //   return Promise.reject(Error('Missing OID4VCI issuance provider in context'));
    // }
    //
    // if (!openId4VcIssuanceProvider.serverMetadata) {
    //   return Promise.reject(Error('OID4VCI issuance provider has no server metadata'));
    // }

    const correlationId: string = new URL(serverMetadata.issuer).hostname; // TODO URL we need support for both react and react-native
    return context.agent.cmGetContacts({
      filter: [
        {
          identities: {
            identifier: {
              correlationId,
            },
          },
        },
      ],
    }).then((contacts: Array<Party>): Party | undefined => (contacts.length === 1 ? contacts[0] : undefined));
  }

  private async oid4vciHolderGetCredentials(args: RetrieveCredentialsArgs, context: RequiredContext): Promise<Array<MappedCredentialToAccept>> {
    const {verificationCode, selectedCredentials, openID4VCIClientState} = args;

    if (!openID4VCIClientState) {
      throw Error('Missing openID4VCI client state in context')
    }

    return this.onGetCredentials({
      credentials: selectedCredentials,
      pin: verificationCode,
      openID4VCIClientState
    })
    .then(mapCredentialToAccept)
  }

  private async oid4vciHolderAddContactIdentity(args: AddContactIdentityArgs, context: RequiredContext): Promise<Identity> {
    const { credentialsToAccept, contact } = args;

    if (!contact) {
      return Promise.reject(Error('Missing contact in context'));
    }

    if (credentialsToAccept === undefined || credentialsToAccept.length === 0) {
      return Promise.reject(Error('Missing credential offers in context'));
    }

    const correlationId: string = credentialsToAccept[0].correlationId;
    const identity: NonPersistedIdentity = {
      alias: correlationId,
      roles: [IdentityRoleEnum.ISSUER],
      identifier: {
        type: CorrelationIdentifierEnum.DID,
        correlationId,
      },
    };


    // TODO emit event

    // TODO also think about toasts?? mobile and web
    return context.agent.cmAddIdentity({contactId: contact.id, identity})

    //return store.dispatch<any>(addIdentity({contactId: contact.id, identity}));
  }

  private async oid4vciHolderAssertValidCredentials(args: AssertValidCredentialsArgs, context: RequiredContext): Promise<void> { // TODO return boolean for rest
    const { credentialsToAccept } = args;

    await Promise.all(credentialsToAccept
      .map(async (mappedCredential: MappedCredentialToAccept): Promise<void> => verifyCredentialToAccept({ mappedCredential, context }))
    );
  }

  private async oid4vciHolderStoreCredentialBranding(args: StoreCredentialBrandingArgs, context: RequiredContext): Promise<void> {
    const { credentialBranding, serverMetadata, selectedCredentials, credentialsToAccept,  } = args;

    // if (!serverMetadata) {
    //   return Promise.reject(Error('OID4VCI issuance provider has no server metadata'));
    // }

    const localeBranding: Array<IBasicCredentialLocaleBranding> | undefined = credentialBranding?.get(
      selectedCredentials[0],
    );
    if (localeBranding && localeBranding.length > 0) {
      await context.agent.addCredentialBranding({
        vcHash: computeEntryHash(credentialsToAccept[0].rawVerifiableCredential),
        issuerCorrelationId: new URL(serverMetadata.issuer).hostname,
        localeBranding,
      });
    }
    // TODO emit event???
  }

  private async oid4vciHolderStoreCredentials(args: StoreCredentialsArgs, context: RequiredContext): Promise<void> {
    const { credentialsToAccept } = args;

    const vc = credentialsToAccept[0].rawVerifiableCredential
    const mappedVc = <VerifiableCredential>CredentialMapper.toUniformCredential(<OriginalVerifiableCredential>vc);
    await context.agent.dataStoreSaveVerifiableCredential({verifiableCredential: mappedVc});
    // TODO emit event
    //store.dispatch<any>(storeVerifiableCredential(credentialsToAccept[0].rawVerifiableCredential));
  }

}
