import { decodeUriAsJson, PresentationSignCallback, SupportedVersion, VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import {
  ConnectionType,
  CorrelationIdentifierType,
  CredentialDocumentFormat,
  CredentialRole,
  DocumentType,
  Identity,
  IdentityOrigin,
  NonPersistedIdentity,
  Party,
} from '@sphereon/ssi-sdk.data-store'
import { HasherSync, Loggers, SdJwtDecodedVerifiableCredential } from '@sphereon/ssi-types'
import { IAgentPlugin } from '@veramo/core'
import { v4 as uuidv4 } from 'uuid'

import { OpSession } from '../session'
import { PEX, Status } from '@sphereon/pex'
import { computeEntryHash } from '@veramo/utils'
import { UniqueDigitalCredential } from '@sphereon/ssi-sdk.credential-store'
import { EventEmitter } from 'events'
import {
  DidAuthSiopOpAuthenticatorOptions,
  GetSelectableCredentialsArgs,
  IDidAuthSiopOpAuthenticator,
  IGetSiopSessionArgs,
  IOpSessionArgs,
  IRegisterCustomApprovalForSiopArgs,
  IRemoveCustomApprovalForSiopArgs,
  IRemoveSiopSessionArgs,
  IRequiredContext,
  Json,
  LOGGER_NAMESPACE,
  RequiredContext,
  SelectableCredentialsMap,
  Siopv2AuthorizationResponseData,
  VerifiableCredentialsWithDefinition,
} from '../types'

import {
  AddIdentityArgs,
  CreateConfigArgs,
  CreateConfigResult,
  GetSiopRequestArgs,
  OnContactIdentityCreatedArgs,
  OnIdentifierCreatedArgs,
  RetrieveContactArgs,
  SendResponseArgs,
  Siopv2AuthorizationRequestData,
  Siopv2HolderEvent,
  Siopv2Machine as Siopv2MachineId,
  Siopv2MachineInstanceOpts,
} from '../types'
import { DcqlCredential, DcqlPresentation, DcqlQuery, DcqlSdJwtVcCredential } from 'dcql'
import { Siopv2Machine } from '../machine/Siopv2Machine'
import { getSelectableCredentials, siopSendAuthorizationResponse, translateCorrelationIdToName } from '../services/Siopv2MachineService'
import { schema } from '..'

const logger = Loggers.DEFAULT.options(LOGGER_NAMESPACE, {}).get(LOGGER_NAMESPACE)

// Exposing the methods here for any REST implementation
export const didAuthSiopOpAuthenticatorMethods: Array<string> = [
  'cmGetContacts',
  'cmGetContact',
  'cmAddContact',
  'cmAddIdentity',
  'didManagerFind',
  'didManagerGet',
  'keyManagerSign',
  'didManagerGetProviders',
  'dataStoreORMGetVerifiableCredentials',
  'createVerifiablePresentation',
]

export class DidAuthSiopOpAuthenticator implements IAgentPlugin {
  readonly schema = schema.IDidAuthSiopOpAuthenticator
  readonly methods: IDidAuthSiopOpAuthenticator = {
    siopGetOPSession: this.siopGetOPSession.bind(this),
    siopRegisterOPSession: this.siopRegisterOPSession.bind(this),
    siopRemoveOPSession: this.siopRemoveOPSession.bind(this),
    siopRegisterOPCustomApproval: this.siopRegisterOPCustomApproval.bind(this),
    siopRemoveOPCustomApproval: this.siopRemoveOPCustomApproval.bind(this),

    siopGetMachineInterpreter: this.siopGetMachineInterpreter.bind(this),
    siopCreateConfig: this.siopCreateConfig.bind(this),
    siopGetSiopRequest: this.siopGetSiopRequest.bind(this),
    siopRetrieveContact: this.siopRetrieveContact.bind(this),
    siopAddIdentity: this.siopAddContactIdentity.bind(this),
    siopSendResponse: this.siopSendResponse.bind(this),
    siopGetSelectableCredentials: this.siopGetSelectableCredentials.bind(this),
  }

  private readonly sessions: Map<string, OpSession>
  private readonly customApprovals: Record<string, (verifiedAuthorizationRequest: VerifiedAuthorizationRequest, sessionId: string) => Promise<void>>
  private readonly presentationSignCallback?: PresentationSignCallback
  private readonly onContactIdentityCreated?: (args: OnContactIdentityCreatedArgs) => Promise<void>
  private readonly onIdentifierCreated?: (args: OnIdentifierCreatedArgs) => Promise<void>
  private readonly eventEmitter?: EventEmitter
  private readonly hasher?: HasherSync

  constructor(options?: DidAuthSiopOpAuthenticatorOptions) {
    const { onContactIdentityCreated, onIdentifierCreated, hasher, customApprovals = {}, presentationSignCallback } = { ...options }

    this.hasher = hasher
    this.onContactIdentityCreated = onContactIdentityCreated
    this.onIdentifierCreated = onIdentifierCreated
    this.presentationSignCallback = presentationSignCallback
    this.sessions = new Map<string, OpSession>()
    this.customApprovals = customApprovals
  }

  public async onEvent(event: any, context: RequiredContext): Promise<void> {
    switch (event.type) {
      case Siopv2HolderEvent.CONTACT_IDENTITY_CREATED:
        this.onContactIdentityCreated?.(event.data)
        break
      case Siopv2HolderEvent.IDENTIFIER_CREATED:
        this.onIdentifierCreated?.(event.data)
        break
      default:
        return Promise.reject(Error(`Event type ${event.type} not supported`))
    }
  }

  private async siopGetOPSession(args: IGetSiopSessionArgs, context: IRequiredContext): Promise<OpSession> {
    // TODO add cleaning up sessions https://sphereon.atlassian.net/browse/MYC-143
    if (!this.sessions.has(args.sessionId)) {
      throw Error(`No session found for id: ${args.sessionId}`)
    }

    return this.sessions.get(args.sessionId)!
  }

  private async siopRegisterOPSession(args: Omit<IOpSessionArgs, 'context'>, context: IRequiredContext): Promise<OpSession> {
    const sessionId = args.sessionId || uuidv4()
    if (this.sessions.has(sessionId)) {
      return Promise.reject(new Error(`Session with id: ${args.sessionId} already present`))
    }
    const opts = { ...args, sessionId, context } as Required<IOpSessionArgs>
    if (!opts.op?.presentationSignCallback) {
      opts.op = { ...opts.op, presentationSignCallback: this.presentationSignCallback }
    }
    const session = await OpSession.init(opts)
    this.sessions.set(sessionId, session)
    return session
  }

  private async siopRemoveOPSession(args: IRemoveSiopSessionArgs, context: IRequiredContext): Promise<boolean> {
    return this.sessions.delete(args.sessionId)
  }

  private async siopRegisterOPCustomApproval(args: IRegisterCustomApprovalForSiopArgs, context: IRequiredContext): Promise<void> {
    if (this.customApprovals[args.key] !== undefined) {
      return Promise.reject(new Error(`Custom approval with key: ${args.key} already present`))
    }

    this.customApprovals[args.key] = args.customApproval
  }

  private async siopRemoveOPCustomApproval(args: IRemoveCustomApprovalForSiopArgs, context: IRequiredContext): Promise<boolean> {
    return delete this.customApprovals[args.key]
  }

  private async siopGetMachineInterpreter(opts: Siopv2MachineInstanceOpts, context: RequiredContext): Promise<Siopv2MachineId> {
    const { stateNavigationListener, url } = opts
    const services = {
      createConfig: (args: CreateConfigArgs) => this.siopCreateConfig(args),
      getSiopRequest: (args: GetSiopRequestArgs) => this.siopGetSiopRequest(args, context),
      getSelectableCredentials: (args: GetSelectableCredentialsArgs) => this.siopGetSelectableCredentials(args, context),
      retrieveContact: (args: RetrieveContactArgs) => this.siopRetrieveContact(args, context),
      addContactIdentity: (args: AddIdentityArgs) => this.siopAddContactIdentity(args, context),
      sendResponse: (args: SendResponseArgs) => this.siopSendResponse(args, context),
      ...opts?.services,
    }

    const siopv2MachineOpts: Siopv2MachineInstanceOpts = {
      ...opts,
      url,
      stateNavigationListener,
      services: {
        ...services,
        ...opts.services,
      },
    }

    return Siopv2Machine.newInstance(siopv2MachineOpts)
  }

  private async siopCreateConfig<TContext extends CreateConfigArgs>(context: TContext): Promise<CreateConfigResult> {
    const { url } = context

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

  private async siopGetSiopRequest(args: GetSiopRequestArgs, context: RequiredContext): Promise<Siopv2AuthorizationRequestData> {
    const { agent } = context
    const { didAuthConfig } = args

    if (args.url === undefined) {
      return Promise.reject(Error('Missing request uri in context'))
    }

    if (didAuthConfig === undefined) {
      return Promise.reject(Error('Missing config in context'))
    }
    const { sessionId, redirectUrl } = didAuthConfig

    const session: OpSession = await agent.siopGetOPSession({ sessionId }).catch(
      async () =>
        await agent.siopRegisterOPSession({
          requestJwtOrUri: redirectUrl,
          sessionId,
          op: { eventEmitter: this.eventEmitter, hasher: this.hasher },
        }),
    )

    logger.debug(`session: ${JSON.stringify(session.id, null, 2)}`)
    const verifiedAuthorizationRequest = await session.getAuthorizationRequest()
    // logger.trace('Request: ' + JSON.stringify(verifiedAuthorizationRequest, null, 2))
    const clientName = verifiedAuthorizationRequest.registrationMetadataPayload?.client_name
    const url =
      verifiedAuthorizationRequest.responseURI ??
      (args.url.includes('request_uri')
        ? decodeURIComponent(args.url.split('?request_uri=')[1].trim())
        : (verifiedAuthorizationRequest.issuer ?? verifiedAuthorizationRequest.registrationMetadataPayload?.client_id))
    const uri: URL | undefined = url.includes('://') ? new URL(url) : undefined
    const correlationId: string = uri?.hostname ?? (await this.determineCorrelationId(uri, verifiedAuthorizationRequest, clientName, context))
    const clientId: string | undefined = await verifiedAuthorizationRequest.authorizationRequest.getMergedProperty<string>('client_id')

    return {
      issuer: verifiedAuthorizationRequest.issuer,
      correlationId,
      registrationMetadataPayload: verifiedAuthorizationRequest.registrationMetadataPayload,
      uri,
      name: clientName,
      clientId,
      presentationDefinitions:
        (await verifiedAuthorizationRequest.authorizationRequest.containsResponseType('vp_token')) ||
        (verifiedAuthorizationRequest.versions.every((version) => version <= SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1) &&
          verifiedAuthorizationRequest.presentationDefinitions &&
          verifiedAuthorizationRequest.presentationDefinitions.length > 0)
          ? verifiedAuthorizationRequest.presentationDefinitions
          : undefined,
      dcqlQuery: verifiedAuthorizationRequest.dcqlQuery,
    }
  }

  private async determineCorrelationId(
    uri: URL | undefined,
    verifiedAuthorizationRequest: any,
    clientName: string | undefined,
    context: RequiredContext,
  ): Promise<string> {
    if (uri) {
      return (await translateCorrelationIdToName(uri.hostname, context)) ?? uri.hostname
    }

    if (verifiedAuthorizationRequest.issuer) {
      const issuerHostname = verifiedAuthorizationRequest.issuer.split('://')[1]
      return (await translateCorrelationIdToName(issuerHostname, context)) ?? issuerHostname
    }

    if (clientName) {
      return clientName
    }

    throw new Error("Can't determine correlationId from request")
  }

  private async siopRetrieveContact(args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined> {
    const { authorizationRequestData } = args
    const { agent } = context

    if (authorizationRequestData === undefined) {
      return Promise.reject(Error('Missing authorization request data in context'))
    }

    return agent
      .cmGetContacts({
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

  private async siopAddContactIdentity(args: AddIdentityArgs, context: RequiredContext): Promise<void> {
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
          type: correlationId.startsWith('did:') ? CorrelationIdentifierType.DID : CorrelationIdentifierType.URL,
          correlationId,
        },
      }
      const addedIdentity: Identity = await agent.cmAddIdentity({ contactId: contact.id, identity })
      await context.agent.emit(Siopv2HolderEvent.CONTACT_IDENTITY_CREATED, {
        contactId: contact.id,
        identity: addedIdentity,
      })
      logger.info(`Contact identity created: ${JSON.stringify(addedIdentity)}`)
    }
  }

  private async siopSendResponse(args: SendResponseArgs, context: RequiredContext): Promise<Siopv2AuthorizationResponseData> {
    const { didAuthConfig, authorizationRequestData, selectedCredentials, isFirstParty } = args

    if (didAuthConfig === undefined) {
      return Promise.reject(Error('Missing config in context'))
    }

    if (authorizationRequestData === undefined) {
      return Promise.reject(Error('Missing authorization request data in context'))
    }

    const pex = new PEX({ hasher: this.hasher })
    const verifiableCredentialsWithDefinition: Array<VerifiableCredentialsWithDefinition> = []
    const dcqlCredentialsWithCredentials: Map<DcqlCredential, UniqueDigitalCredential> = new Map()

    if (Array.isArray(authorizationRequestData.presentationDefinitions) && authorizationRequestData?.presentationDefinitions.length > 0) {
      try {
        authorizationRequestData.presentationDefinitions?.forEach((presentationDefinition) => {
          const { areRequiredCredentialsPresent, verifiableCredential: verifiableCredentials } = pex.selectFrom(
            presentationDefinition.definition,
            selectedCredentials.map((udc) => udc.originalVerifiableCredential!),
          )

          if (areRequiredCredentialsPresent !== Status.ERROR && verifiableCredentials) {
            let uniqueDigitalCredentials: UniqueDigitalCredential[] = []
            uniqueDigitalCredentials = verifiableCredentials.map((vc) => {
              // @ts-ignore FIXME Funke
              const hash = typeof vc === 'string' ? computeEntryHash(vc.split('~'[0])) : computeEntryHash(vc)
              const udc = selectedCredentials.find((udc) => udc.hash == hash || udc.originalVerifiableCredential == vc)

              if (!udc) {
                throw Error(
                  `UniqueDigitalCredential could not be found in store. Either the credential is not present in the store or the hash is not correct.`,
                )
              }
              return udc
            })
            verifiableCredentialsWithDefinition.push({
              definition: presentationDefinition,
              credentials: uniqueDigitalCredentials,
            })
          }
        })
      } catch (e) {
        return Promise.reject(e)
      }

      if (verifiableCredentialsWithDefinition.length === 0) {
        return Promise.reject(Error('None of the selected credentials match any of the presentation definitions.'))
      }
    } else if (authorizationRequestData.dcqlQuery) {
      //TODO Only SD-JWT and MSO MDOC are supported at the moment
      if (this.hasMDocCredentials(selectedCredentials) || this.hasSdJwtCredentials(selectedCredentials)) {
        try {
          selectedCredentials.forEach((vc) => {
            if (this.isSdJwtCredential(vc)) {
              const payload = (vc.originalVerifiableCredential as SdJwtDecodedVerifiableCredential).decodedPayload
              const result: DcqlSdJwtVcCredential = {
                claims: payload as { [x: string]: Json },
                vct: payload.vct,
                credential_format: 'vc+sd-jwt',
              }
              dcqlCredentialsWithCredentials.set(result, vc)
              //FIXME MDoc namespaces are incompatible: array of strings vs complex object - https://sphereon.atlassian.net/browse/SPRIND-143
            } else {
              throw Error(`Invalid credential format: ${vc.digitalCredential.documentFormat}`)
            }
          })
        } catch (e) {
          return Promise.reject(e)
        }

        const dcqlPresentationRecord: DcqlPresentation.Output = {}
        const queryResult = DcqlQuery.query(authorizationRequestData.dcqlQuery, Array.from(dcqlCredentialsWithCredentials.keys()))
        for (const [key, value] of Object.entries(queryResult.credential_matches)) {
          if (value.success) {
            dcqlPresentationRecord[key] = this.retrieveEncodedCredential(dcqlCredentialsWithCredentials.get(value.output)!) as
              | string
              | { [x: string]: Json }
          }
        }
      }
    }

    const response = await siopSendAuthorizationResponse(
      ConnectionType.SIOPv2_OpenID4VP,
      {
        sessionId: didAuthConfig.sessionId,
        ...(args.idOpts && { idOpts: args.idOpts }),
        ...(authorizationRequestData.presentationDefinitions !== undefined && { verifiableCredentialsWithDefinition }),
        isFirstParty,
        hasher: this.hasher,
      },
      context,
    )

    const contentType = response.headers.get('content-type') || ''
    let responseBody: any = null

    const text = await response.text()
    if (text) {
      responseBody = contentType.includes('application/json') || text.startsWith('{') ? JSON.parse(text) : text
    }

    return {
      body: responseBody,
      url: response?.url,
      queryParams: decodeUriAsJson(response?.url),
    }
  }

  private hasMDocCredentials = (credentials: UniqueDigitalCredential[]): boolean => {
    return credentials.some(this.isMDocCredential)
  }

  private isMDocCredential = (credential: UniqueDigitalCredential) => {
    return (
      credential.digitalCredential.documentFormat === CredentialDocumentFormat.MSO_MDOC &&
      credential.digitalCredential.documentType === DocumentType.VC
    )
  }

  private hasSdJwtCredentials = (credentials: UniqueDigitalCredential[]): boolean => {
    return credentials.some(this.isSdJwtCredential)
  }

  private isSdJwtCredential = (credential: UniqueDigitalCredential) => {
    return (
      credential.digitalCredential.documentFormat === CredentialDocumentFormat.SD_JWT && credential.digitalCredential.documentType === DocumentType.VC
    )
  }

  private retrieveEncodedCredential = (credential: UniqueDigitalCredential) => {
    return credential.originalVerifiableCredential !== undefined &&
      credential.originalVerifiableCredential !== null &&
      (credential?.originalVerifiableCredential as SdJwtDecodedVerifiableCredential)?.compactSdJwtVc !== undefined &&
      (credential?.originalVerifiableCredential as SdJwtDecodedVerifiableCredential)?.compactSdJwtVc !== null
      ? (credential.originalVerifiableCredential as SdJwtDecodedVerifiableCredential).compactSdJwtVc
      : credential.originalVerifiableCredential
  }

  private async siopGetSelectableCredentials(args: GetSelectableCredentialsArgs, context: RequiredContext): Promise<SelectableCredentialsMap> {
    const { authorizationRequestData } = args

    if (
      !authorizationRequestData ||
      !authorizationRequestData.presentationDefinitions ||
      authorizationRequestData.presentationDefinitions.length === 0
    ) {
      return Promise.reject(Error('Missing required fields in arguments or context'))
    }
    if (authorizationRequestData.presentationDefinitions.length > 1) {
      return Promise.reject(Error('Multiple presentation definitions present'))
    }

    return getSelectableCredentials(authorizationRequestData.presentationDefinitions[0].definition, context)
  }
}
