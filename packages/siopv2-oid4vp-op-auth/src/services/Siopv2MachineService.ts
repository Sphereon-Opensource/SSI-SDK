import { SupportedVersion } from '@sphereon/did-auth-siop'
import {
  determineKid,
  getIdentifier,
  getKey,
  getOrCreatePrimaryIdentifier,
  IIdentifierOpts,
  SupportedDidMethodEnum,
} from '@sphereon/ssi-sdk-ext.did-utils'
import { ConnectionType } from '@sphereon/ssi-sdk.data-store'
import { IIdentifier } from '@veramo/core'
import { DidAgents } from '../types/identifier'
import { CredentialMapper, Loggers, PresentationSubmission } from '@sphereon/ssi-types'
import {
  LOGGER_NAMESPACE,
  RequiredContext,
  Siopv2HolderEvent,
  VerifiableCredentialsWithDefinition,
  VerifiablePresentationWithDefinition,
} from '../types'
import { OID4VP, OpSession } from '../session'

const logger = Loggers.DEFAULT.options(LOGGER_NAMESPACE, {}).get(LOGGER_NAMESPACE)

export const siopSendAuthorizationResponse = async (
  connectionType: ConnectionType,
  args: {
    sessionId: string
    verifiableCredentialsWithDefinition?: VerifiableCredentialsWithDefinition[]
    idOpts?: IIdentifierOpts
  },
  context: RequiredContext,
) => {
  const { agent } = context
  const agentContext = { ...context, agent: context.agent as DidAgents }
  let { idOpts } = args

  if (connectionType !== ConnectionType.SIOPv2_OpenID4VP) {
    return Promise.reject(Error(`No supported authentication provider for type: ${connectionType}`))
  }
  const session: OpSession = await agent.siopGetOPSession({ sessionId: args.sessionId })
  let identifiers: Array<IIdentifier> = idOpts ? [await getIdentifier(idOpts, agentContext)] : await session.getSupportedIdentifiers()
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
      logger.log(`No EBSI key present yet. Creating a new one...`)
      const { result: newIdentifier, created } = await getOrCreatePrimaryIdentifier(agentContext, {
        method: SupportedDidMethodEnum.DID_KEY,
        createOpts: { options: { codecName: 'jwk_jcs-pub', type: 'Secp256r1' } },
      })
      logger.log(`EBSI key created: ${newIdentifier.did}`)
      identifiers = [newIdentifier]
      if (created) {
        await agentContext.agent.emit(Siopv2HolderEvent.IDENTIFIER_CREATED, { result: newIdentifier })
      }
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
    logger.log(`NONCE: ${session.nonce}, domain: ${domain}`)

    const firstVC = CredentialMapper.toUniformCredential(credentialsAndDefinitions[0].credentials[0])
    const holder = Array.isArray(firstVC.credentialSubject) ? firstVC.credentialSubject[0].id : firstVC.credentialSubject.id
    if (holder) {
      try {
        identifier = await session.context.agent.didManagerGet({ did: holder })
      } catch (e) {
        logger.log(`Holder DID not found: ${holder}`)
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

    idOpts = presentationsAndDefs[0].identifierOpts
    identifier = await getIdentifier(idOpts, context)

    /*key = await getKey(identifier, 'authentication', context, idOpts.kid)
    const getIdentifierResponse = await getIdentifierWithKey({
      context,
      keyOpts: {
        identifier,
        kid: identifierOpts.kid,
        didMethod: parseDid(identifier.did).method as SupportedDidMethodEnum,
        keyType: key.type
      },
    })*/
    presentationSubmission = presentationsAndDefs[0].presentationSubmission
  }
  const key = await getKey(identifier, 'authentication', session.context, idOpts?.kid)
  if (!idOpts) {
    idOpts = { identifier, kid: determineKid(key, { identifier }) }
  }
  const determinedKid = idOpts!.kid?.includes('#') ? idOpts.kid : determineKid(key, idOpts)
  const kid: string = determinedKid.startsWith('did:') ? determinedKid : `${identifier.did}#${determinedKid}`

  logger.log(`Definitions and locations:`, JSON.stringify(presentationsAndDefs?.[0]?.verifiablePresentation, null, 2))
  logger.log(`Presentation Submission:`, JSON.stringify(presentationSubmission, null, 2))
  logger.log(`kid:`, kid)
  return await session.sendAuthorizationResponse({
    ...(presentationsAndDefs && { verifiablePresentations: presentationsAndDefs?.map((pd) => pd.verifiablePresentation) }),
    ...(presentationSubmission && { presentationSubmission }),
    responseSignerOpts: { identifier, kid },
  })
}

export const translateCorrelationIdToName = async (correlationId: string, context: RequiredContext): Promise<string> => {
  const { agent } = context

  const contacts = await agent.cmGetContacts({
    filter: [{ identities: { identifier: { correlationId } } }],
  })
  if (contacts.length === 0) {
    return Promise.reject(Error(`Unable to find contact for correlationId ${correlationId}`))
  }
  return contacts[0].contact.displayName
}
