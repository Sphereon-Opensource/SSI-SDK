import { SupportedVersion, VerifiedAuthorizationRequest } from '@sphereon/did-auth-siop'
import {
  ConnectionType,
  CorrelationIdentifierType,
  CredentialRole,
  DidAuthConfig,
  IdentityOrigin,
  NonPersistedIdentity,
  Party,
} from '@sphereon/ssi-sdk.data-store'
import { W3CVerifiableCredential } from '@sphereon/ssi-types'
import { v4 as uuidv4 } from 'uuid'
import {
  AddIdentityArgs,
  CreateConfigArgs,
  GetSiopRequestArgs,
  RequiredContext,
  RetrieveContactArgs,
  SendResponseArgs,
  Siopv2AuthorizationRequestData,
} from '../types/ISiopv2Holder'
import { OpSession, VerifiableCredentialsWithDefinition } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth/dist'
import Debug from 'debug'
import { IIdentifier } from '@veramo/core'

const debug: Debug.Debugger = Debug('sphereon:ssi-sdk:siopv2-holder')

export const createConfig = async (args: CreateConfigArgs): Promise<Omit<DidAuthConfig, 'stateId' | 'identifier'>> => {
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

export const getSiopRequest = async (args: GetSiopRequestArgs, context: RequiredContext): Promise<Siopv2AuthorizationRequestData> => {
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

  debug(`session: ${JSON.stringify(session.id, null, 2)}`)
  const verifiedAuthorizationRequest = await session.getAuthorizationRequest()
  debug('Request: ' + JSON.stringify(verifiedAuthorizationRequest, null, 2))
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

export const retrieveContact = async (args: RetrieveContactArgs, context: RequiredContext): Promise<Party | undefined> => {
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

export const addContactIdentity = async (args: AddIdentityArgs): Promise<void> => {
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
    return store.dispatch<any>(addIdentity({ contactId: contact.id, identity }))
  }
}

export const sendResponse = async (args: SendResponseArgs, context: RequiredContext): Promise<Response> => {
  const { didAuthConfig, authorizationRequestData, selectedCredentials } = args
  const { agent } = context

  if (didAuthConfig === undefined) {
    return Promise.reject(Error('Missing config in context'))
  }

  if (authorizationRequestData === undefined) {
    return Promise.reject(Error('Missing authorization request data in context'))
  }

  const response = await siopSendAuthorizationResponse(
    ConnectionType.SIOPv2_OpenID4VP,
    {
      sessionId: didAuthConfig.sessionId,
      ...(authorizationRequestData.presentationDefinitions !== undefined && {
        verifiableCredentialsWithDefinition: [
          {
            definition: authorizationRequestData.presentationDefinitions[0], // TODO 0 check, check siop only
            credentials: selectedCredentials as Array<W3CVerifiableCredential>,
          },
        ],
      }),
    },
    context,
  )
  if (response.status === 302 && response.headers.has('location')) {
    const url = response.headers.get('location') as string
    console.log(`Redirecting to: ${url}`)
    Linking.emit('url', { url })
  }

  return response
}

const siopSendAuthorizationResponse = async (
  connectionType: ConnectionType,
  args: {
    sessionId: string
    verifiableCredentialsWithDefinition?: VerifiableCredentialsWithDefinition[]
  },
  context: RequiredContext,
) => {
  const { agent } = context

  if (connectionType !== ConnectionType.SIOPv2_OpenID4VP) {
    return Promise.reject(Error(`No supported authentication provider for type: ${connectionType}`))
  }
  const session: OpSession = await agent.siopGetOPSession({ sessionId: args.sessionId })
  let identifiers: Array<IIdentifier> = await session.getSupportedIdentifiers()
  if (!identifiers || identifiers.length === 0) {
    throw Error(`No DID methods found in agent that are supported by the relying party`)
  }
  const request = await session.getAuthorizationRequest()
  const aud = await request.authorizationRequest.getMergedProperty<string>('aud')
  console.log(`AUD: ${aud}`)
  console.log(JSON.stringify(request.authorizationRequest))
  const clientId = await request.authorizationRequest.getMergedProperty<string>('client_id')
  const redirectUri = await request.authorizationRequest.getMergedProperty<string>('redirect_uri')
  if (clientId?.toLowerCase().includes('.ebsi.eu') || redirectUri?.toLowerCase().includes('.ebsi.eu')) {
    identifiers = identifiers.filter((id) => id.did.toLowerCase().startsWith('did:key:') || id.did.toLowerCase().startsWith('did:ebsi:'))
    if (identifiers.length === 0) {
      debug(`No EBSI key present yet. Creating a new one...`)
      const identifier = await getOrCreatePrimaryIdentifier({
        method: SupportedDidMethodEnum.DID_KEY,
        createOpts: { options: { codecName: 'jwk_jcs-pub', type: 'Secp256r1' } },
      })
      debug(`EBSI key created: ${identifier.did}`)
      identifiers = [identifier]
    }
  }
  if (aud && aud.startsWith('did:')) {
    // The RP knows our did, so we can use it
    if (!identifiers.some((id) => id.did === aud)) {
      throw Error(`The aud DID ${aud} is not in the supported identifiers ${identifiers.map((id) => id.did)}`)
    }
    identifiers = [identifiers.find((id) => id.did === aud) as IIdentifier]
  }

  // todo: This should be moved to code calling the sendAuthorizationResponse (this) method, as to allow the user to subselect and approve credentials!
  let presentationsAndDefs: VerifiablePresentationWithDefinition[] | undefined
  let identifier: IIdentifier = identifiers[0]
  let presentationSubmission: PresentationSubmission | undefined
  if (await session.hasPresentationDefinitions()) {
    const oid4vp: OID4VP = await session.getOID4VP()

    const credentialsAndDefinitions = args.verifiableCredentialsWithDefinition
      ? args.verifiableCredentialsWithDefinition
      : await oid4vp.filterCredentialsAgainstAllDefinitions()
    const domain =
      ((await request.authorizationRequest.getMergedProperty('client_id')) as string) ??
      request.issuer ??
      (request.versions.includes(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
        ? 'https://self-issued.me/v2/openid-vc'
        : 'https://self-issued.me/v2')
    debug(`NONCE: ${session.nonce}, domain: ${domain}`)

    const firstVC = CredentialMapper.toUniformCredential(credentialsAndDefinitions[0].credentials[0])
    const holder = Array.isArray(firstVC.credentialSubject) ? firstVC.credentialSubject[0].id : firstVC.credentialSubject.id
    if (holder) {
      try {
        identifier = await session.context.agent.didManagerGet({ did: holder })
      } catch (e) {
        debug(`Holder DID not found: ${holder}`)
      }
    }

    presentationsAndDefs = await oid4vp.createVerifiablePresentations(credentialsAndDefinitions, {
      identifierOpts: { identifier },
      proofOpts: {
        nonce: session.nonce,
        domain,
      },
    })
    if (!presentationsAndDefs || presentationsAndDefs.length === 0) {
      throw Error('No verifiable presentations could be created')
    } else if (presentationsAndDefs.length > 1) {
      throw Error(`Only one verifiable presentation supported for now. Got ${presentationsAndDefs.length}`)
    }

    identifier = await getIdentifier(presentationsAndDefs[0].identifierOpts, agentContext)
    presentationSubmission = presentationsAndDefs[0].presentationSubmission
  }
  const kid: string = (await getKey(identifier, 'authentication', session.context)).kid

  debug(`Definitions and locations:`, JSON.stringify(presentationsAndDefs?.[0]?.verifiablePresentation, null, 2))
  debug(`Presentation Submission:`, JSON.stringify(presentationSubmission, null, 2))
  const response = session.sendAuthorizationResponse({
    ...(presentationsAndDefs && { verifiablePresentations: presentationsAndDefs?.map((pd) => pd.verifiablePresentation) }),
    ...(presentationSubmission && { presentationSubmission }),
    responseSignerOpts: { identifier, kid },
  })
  debug(`Response: `, response)

  return await response
}

export const translateCorrelationIdToName = (correlationId: string): string => {
  // TODO BEFORE PR

  /*const contacts: Array<Party> = store.getState().contact.contacts
    const activeUser: IUser | undefined = store.getState().user.activeUser

    const contact: Party | undefined = contacts.find((contact: Party) =>
      contact.identities.some((identity: Identity): boolean => identity.identifier.correlationId === correlationId),
    )
    if (contact) {
      return contact.contact.displayName
    }

    if (activeUser && activeUser.identifiers.some((identifier: IUserIdentifier): boolean => identifier.did === correlationId)) {
      return `${activeUser.firstName} ${activeUser.lastName}`
    }
  */
  return correlationId
}
