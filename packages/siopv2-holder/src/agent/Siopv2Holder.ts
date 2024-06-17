/**
 * {@inheritDoc ISiopv2Holder}
 */
import { IAgentPlugin } from '@veramo/core'
import {
  AddIdentityArgs,
  CreateConfigArgs,
  CreateConfigResult,
  GetSiopRequestArgs,
  ISiopv2Holder,
  OnContactIdentityCreatedArgs,
  OnCredentialStoredArgs,
  OnIdentifierCreatedArgs,
  RequiredContext,
  RetrieveContactArgs,
  SendResponseArgs,
  Siopv2AuthorizationRequestData,
  Siopv2HolderEvent,
  Siopv2HolderOptions,
} from '../types/ISiopv2Holder'
import { Siopv2Machine } from '../machine/Siopv2Machine'
import { Siopv2Machine as Siopv2MachineId } from '../types/machine'

import { Loggers, LogMethod, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { v4 as uuidv4 } from 'uuid'
import { OpSession } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { SupportedVersion } from '@sphereon/did-auth-siop'
import { ConnectionType, CorrelationIdentifierType, CredentialRole, IdentityOrigin, NonPersistedIdentity, Party } from '@sphereon/ssi-sdk.data-store'
import { siopSendAuthorizationResponse, translateCorrelationIdToName } from './Siopv2HolderService'
import { Siopv2MachineInstanceOpts } from '../types/machine'

// Exposing the methods here for any REST implementation
export const Siopv2HolderContextMethods: Array<string> = []

const logger = Loggers.DEFAULT.options('sphereon:Siopv2:holder', { methods: [LogMethod.CONSOLE, LogMethod.DEBUG_PKG] }).get('sphereon:Siopv2:holder')

export class Siopv2Holder implements IAgentPlugin {
  readonly eventTypes: Array<Siopv2HolderEvent> = [
    Siopv2HolderEvent.IDENTIFIER_CREATED,
    Siopv2HolderEvent.CONTACT_IDENTITY_CREATED,
    Siopv2HolderEvent.CREDENTIAL_STORED,
  ]

  readonly methods: ISiopv2Holder = {
    siopv2HolderGetMachineInterpreter: this.siopv2HolderGetMachineInterpreter.bind(this),
    siopv2HolderCreateConfig: this.siopv2HolderCreateConfig.bind(this).bind(this),
    siopv2HolderGetSiopRequest: this.siopv2HolderGetSiopRequest.bind(this).bind(this),
    siopv2HolderRetrieveContact: this.siopv2HolderRetrieveContact.bind(this).bind(this),
    siopv2HolderAddIdentity: this.siopv2HolderAddContactIdentity.bind(this).bind(this),
    siopv2HolderSendResponse: this.siopv2HolderSendResponse.bind(this).bind(this),
  }

  private readonly onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  private readonly onCredentialStored?: (args: OnCredentialStoredArgs) => Promise<void>
  private readonly onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>

  constructor(options?: Siopv2HolderOptions) {
    const { onContactIdentityCreated, onCredentialStored, onIdentifierCreated } = options ?? {}

    this.onContactIdentityCreated = onContactIdentityCreated
    this.onCredentialStored = onCredentialStored
    this.onIdentifierCreated = onIdentifierCreated
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case Siopv2HolderEvent.CONTACT_IDENTITY_CREATED:
        this.onContactIdentityCreated?.(event.data)
        break
      case Siopv2HolderEvent.CREDENTIAL_STORED:
        this.onCredentialStored?.(event.data)
        break
      case Siopv2HolderEvent.IDENTIFIER_CREATED:
        this.onIdentifierCreated?.(event.data)
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  private async siopv2HolderGetMachineInterpreter(opts: Siopv2MachineInstanceOpts, context: RequiredContext): Promise<Siopv2MachineId> {
    const { stateNavigationListener, url } = opts
    const services = {
      createConfig: (args: CreateConfigArgs) => this.siopv2HolderCreateConfig(args),
      getSiopRequest: (args: GetSiopRequestArgs) => this.siopv2HolderGetSiopRequest(args, context),
      retrieveContact: (args: RetrieveContactArgs) => this.siopv2HolderRetrieveContact(args, context),
      addContactIdentity: (args: AddIdentityArgs) => this.siopv2HolderAddContactIdentity(args, context),
      sendResponse: (args: SendResponseArgs) => this.siopv2HolderSendResponse(args, context),
      ...opts?.services,
    }

    const siopv2MachineOpts: Siopv2MachineInstanceOpts = {
      url,
      stateNavigationListener,
      services: {
        ...services,
        ...opts.services,
      },
    }

    return Siopv2Machine.newInstance(siopv2MachineOpts)
  }

  private async siopv2HolderCreateConfig(args: CreateConfigArgs): Promise<CreateConfigResult> {
    const { url } = args

    if (!url) {
      return Promise.reject(Error('Missing request uri in context'))
    }

    return {
      id: uuidv4(),
      // FIXME: Update these values in SSI-SDK. Only the URI (not a redirectURI) would be available at this point
      sessionId: uuidv4(),
      redirectUrl: url,
    }
  }

  private async siopv2HolderGetSiopRequest(args: GetSiopRequestArgs, context: RequiredContext): Promise<Siopv2AuthorizationRequestData> {
    const { agent } = context
    const { didAuthConfig } = args

    if (args.url === undefined) {
      return Promise.reject(Error('Missing request uri in context'))
    }

    if (didAuthConfig === undefined) {
      return Promise.reject(Error('Missing config in context'))
    }
    const { sessionId, redirectUrl } = didAuthConfig

    const session: OpSession = await agent
      .siopGetOPSession({ sessionId })
      .catch(async () => await agent.siopRegisterSession({ requestJwtOrUri: redirectUrl, sessionId }))

    logger.debug(`session: ${JSON.stringify(session.id, null, 2)}`)
    const verifiedAuthorizationRequest = await session.getAuthorizationRequest()
    logger.debug('Request: ' + JSON.stringify(verifiedAuthorizationRequest, null, 2))
    const name = verifiedAuthorizationRequest.registrationMetadataPayload?.client_name
    const url =
      verifiedAuthorizationRequest.responseURI ??
      (args.url.includes('request_uri')
        ? decodeURIComponent(args.url.split('?request_uri=')[1].trim())
        : verifiedAuthorizationRequest.issuer ?? verifiedAuthorizationRequest.registrationMetadataPayload?.client_id)
    const uri: URL | undefined = url.includes('://') ? new URL(url) : undefined
    const correlationIdName = uri
      ? translateCorrelationIdToName(uri.hostname)
      : verifiedAuthorizationRequest.issuer
        ? translateCorrelationIdToName(verifiedAuthorizationRequest.issuer.split('://')[1])
        : name
    const correlationId: string = uri?.hostname ?? correlationIdName
    const clientId: string | undefined = await verifiedAuthorizationRequest.authorizationRequest.getMergedProperty<string>('client_id')

    return {
      issuer: verifiedAuthorizationRequest.issuer,
      correlationId,
      registrationMetadataPayload: verifiedAuthorizationRequest.registrationMetadataPayload,
      uri,
      name,
      clientId,
      presentationDefinitions:
        (await verifiedAuthorizationRequest.authorizationRequest.containsResponseType('vp_token')) ||
        (verifiedAuthorizationRequest.versions.every((version) => version <= SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1) &&
          verifiedAuthorizationRequest.presentationDefinitions &&
          verifiedAuthorizationRequest.presentationDefinitions.length > 0)
          ? verifiedAuthorizationRequest.presentationDefinitions
          : undefined,
    }
  }

  private async siopv2HolderRetrieveContact(args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined> {
    const { authorizationRequestData } = args
    const { agent } = context

    if (authorizationRequestData === undefined) {
      return Promise.reject(Error('Missing authorization request data in context'))
    }

    return agent
      .getContacts({
        filter: [
          {
            identities: {
              identifier: {
                correlationId: authorizationRequestData.correlationId,
              },
            },
          },
        ],
      })
      .then((contacts: Array<Party>): Party | undefined => (contacts.length === 1 ? contacts[0] : undefined))
  }

  private async siopv2HolderAddContactIdentity(args: AddIdentityArgs, context: RequiredContext): Promise<void> {
    const { agent } = context
    const { contact, authorizationRequestData } = args

    if (contact === undefined) {
      return Promise.reject(Error('Missing contact in context'))
    }

    if (authorizationRequestData === undefined) {
      return Promise.reject(Error('Missing authorization request data in context'))
    }

    // TODO: Makes sense to move these types of common queries/retrievals to the SIOP auth request object
    const clientId: string | undefined = authorizationRequestData.clientId ?? authorizationRequestData.issuer
    const correlationId: string | undefined = clientId
      ? clientId.startsWith('did:')
        ? clientId
        : `${new URL(clientId).protocol}//${new URL(clientId).hostname}`
      : undefined

    if (correlationId) {
      const identity: NonPersistedIdentity = {
        alias: correlationId,
        origin: IdentityOrigin.EXTERNAL,
        roles: [CredentialRole.ISSUER],
        identifier: {
          type: CorrelationIdentifierType.DID,
          correlationId,
        },
      }
      return agent.cmAddIdentity({ contactId: contact.id, identity })
    }
  }

  private async siopv2HolderSendResponse(args: SendResponseArgs, context: RequiredContext): Promise<Response> {
    const { didAuthConfig, authorizationRequestData, selectedCredentials } = args

    if (didAuthConfig === undefined) {
      return Promise.reject(Error('Missing config in context'))
    }

    if (authorizationRequestData === undefined) {
      return Promise.reject(Error('Missing authorization request data in context'))
    }

    return await siopSendAuthorizationResponse(
      ConnectionType.SIOPv2_OpenID4VP,
      {
        sessionId: didAuthConfig.sessionId,
        ...(authorizationRequestData.presentationDefinitions !== undefined && {
          verifiableCredentialsWithDefinition: [
            {
              definition: authorizationRequestData.presentationDefinitions[0], // TODO BEFORE PR 0 check, check siop only
              credentials: selectedCredentials as Array<W3CVerifiableCredential>,
            },
          ],
        }),
      },
      context,
    )
  }
}
