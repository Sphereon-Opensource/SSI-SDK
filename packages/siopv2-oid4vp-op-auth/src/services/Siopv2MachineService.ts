import { AuthorizationRequest, SupportedVersion } from '@sphereon/did-auth-siop'
import { IPresentationDefinition, PEX } from '@sphereon/pex'
import { InputDescriptorV1, InputDescriptorV2, PresentationDefinitionV1, PresentationDefinitionV2 } from '@sphereon/pex-models'
import { ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { verifiableCredentialForRoleFilter } from '@sphereon/ssi-sdk.credential-store'
import { ConnectionType, CredentialRole } from '@sphereon/ssi-sdk.data-store'
import { CredentialMapper, Loggers, PresentationSubmission } from '@sphereon/ssi-types'
import { OID4VP, OpSession } from '../session'
import {
  DidAgents,
  LOGGER_NAMESPACE,
  RequiredContext,
  SelectableCredential,
  SelectableCredentialsMap,
  Siopv2HolderEvent,
  SuitableCredentialAgents,
  VerifiableCredentialsWithDefinition,
  VerifiablePresentationWithDefinition,
} from '../types'
import { IAgentContext, IDIDManager } from '@veramo/core'
import { getOrCreatePrimaryIdentifier, SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'

export const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)

const createEbsiIdentifier = async (agentContext: IAgentContext<IDIDManager>): Promise<ManagedIdentifierOptsOrResult> => {
  logger.log(`No EBSI key present yet. Creating a new one...`)
  const { result: newIdentifier, created } = await getOrCreatePrimaryIdentifier(agentContext, {
    method: SupportedDidMethodEnum.DID_KEY,
    createOpts: { options: { codecName: 'jwk_jcs-pub', type: 'Secp256r1' } },
  })
  logger.log(`EBSI key created: ${newIdentifier.did}`)
  if (created) {
    await agentContext.agent.emit(Siopv2HolderEvent.IDENTIFIER_CREATED, { result: newIdentifier })
  }
  return await agentContext.agent.identifierManagedGetByDid({ identifier: newIdentifier.did })
}

const hasEbsiClient = async (authorizationRequest: AuthorizationRequest) => {
  const clientId = await authorizationRequest.getMergedProperty<string>('client_id')
  const redirectUri = await authorizationRequest.getMergedProperty<string>('redirect_uri')
  return clientId?.toLowerCase().includes('.ebsi.eu') || redirectUri?.toLowerCase().includes('.ebsi.eu')
}

export const siopSendAuthorizationResponse = async (
  connectionType: ConnectionType,
  args: {
    sessionId: string
    verifiableCredentialsWithDefinition?: VerifiableCredentialsWithDefinition[]
    idOpts?: ManagedIdentifierOptsOrResult
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
  const request = await session.getAuthorizationRequest()
  const aud = await request.authorizationRequest.getMergedProperty<string>('aud')
  logger.debug(`AUD: ${aud}`)
  logger.debug(JSON.stringify(request.authorizationRequest))

  let presentationsAndDefs: VerifiablePresentationWithDefinition[] | undefined
  let presentationSubmission: PresentationSubmission | undefined
  if (await session.hasPresentationDefinitions()) {
    const oid4vp: OID4VP = await session.getOID4VP({})

    const credentialsAndDefinitions = args.verifiableCredentialsWithDefinition
      ? args.verifiableCredentialsWithDefinition
      : await oid4vp.filterCredentialsAgainstAllDefinitions(CredentialRole.HOLDER)
    const domain =
      ((await request.authorizationRequest.getMergedProperty('client_id')) as string) ??
      request.issuer ??
      (request.versions.includes(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
        ? 'https://self-issued.me/v2/openid-vc'
        : 'https://self-issued.me/v2')
    logger.log(`NONCE: ${session.nonce}, domain: ${domain}`)

    const firstUniqueDC = credentialsAndDefinitions[0].credentials[0]
    if (typeof firstUniqueDC !== 'object' || !('digitalCredential' in firstUniqueDC)) {
      return Promise.reject(Error('SiopMachine only supports UniqueDigitalCredentials for now'))
    }
    let identifier: ManagedIdentifierOptsOrResult
    const digitalCredential = firstUniqueDC.digitalCredential
    switch (digitalCredential.subjectCorrelationType) {
      case 'DID':
        identifier = await session.context.agent.identifierManagedGetByDid({
          identifier: digitalCredential.subjectCorrelationId,
          kmsKeyRef: digitalCredential.kmsKeyRef,
        })
        break
      default:
        identifier = await session.context.agent.identifierManagedGetByKid({
          identifier: digitalCredential.kmsKeyRef,
          kmsKeyRef: digitalCredential.kmsKeyRef,
        })
    }

    if (identifier === undefined && idOpts !== undefined && (await hasEbsiClient(request.authorizationRequest))) {
      identifier = await createEbsiIdentifier(agentContext)
    }

    presentationsAndDefs = await oid4vp.createVerifiablePresentations(CredentialRole.HOLDER, credentialsAndDefinitions, {
      idOpts: identifier,
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

    idOpts = presentationsAndDefs[0].idOpts
    presentationSubmission = presentationsAndDefs[0].presentationSubmission
  }
  logger.log(`Definitions and locations:`, JSON.stringify(presentationsAndDefs?.[0]?.verifiablePresentation, null, 2))
  logger.log(`Presentation Submission:`, JSON.stringify(presentationSubmission, null, 2))
  return await session.sendAuthorizationResponse({
    ...(presentationsAndDefs && { verifiablePresentations: presentationsAndDefs?.map((pd) => pd.verifiablePresentation) }),
    ...(presentationSubmission && { presentationSubmission }),
    // todo: Change issuer value in case we do not use identifier. Use key.meta.jwkThumbprint then
    responseSignerOpts: idOpts!,
  })
}

function buildPartialPD(
  inputDescriptor: InputDescriptorV1 | InputDescriptorV2,
  presentationDefinition: PresentationDefinitionV1 | PresentationDefinitionV2,
): IPresentationDefinition {
  return {
    ...presentationDefinition,
    input_descriptors: [inputDescriptor],
  } as IPresentationDefinition
}

export const getSelectableCredentials = async (
  presentationDefinition: IPresentationDefinition,
  context: RequiredContext,
): Promise<SelectableCredentialsMap> => {
  const agentContext = { ...context, agent: context.agent as SuitableCredentialAgents }
  const { agent } = agentContext
  const pex = new PEX()

  const uniqueVerifiableCredentials = await agent.crsGetUniqueCredentials({
    filter: verifiableCredentialForRoleFilter(CredentialRole.HOLDER),
  })
  const credentialBranding = await agent.ibGetCredentialBranding()

  const selectableCredentialsMap: SelectableCredentialsMap = new Map()

  for (const inputDescriptor of presentationDefinition.input_descriptors) {
    const partialPD = buildPartialPD(inputDescriptor, presentationDefinition)
    const originalCredentials = uniqueVerifiableCredentials.map((uniqueVC) => {
      return CredentialMapper.storedCredentialToOriginalFormat(uniqueVC.originalVerifiableCredential!) // ( ! is valid for verifiableCredentialForRoleFilter )
    })
    const selectionResults = pex.selectFrom(partialPD, originalCredentials)

    const selectableCredentials: Array<SelectableCredential> = []
    for (const selectedCredential of selectionResults.verifiableCredential || []) {
      const filteredUniqueVC = uniqueVerifiableCredentials.find((uniqueVC) => {
        const proof = uniqueVC.uniformVerifiableCredential!.proof
        return Array.isArray(proof) ? proof.some((proofItem) => proofItem.jwt === selectedCredential) : proof.jwt === selectedCredential
      })

      if (filteredUniqueVC) {
        const filteredCredentialBrandings = credentialBranding.filter((cb) => cb.vcHash === filteredUniqueVC.hash)
        const issuerPartyIdentity = await agent.cmGetContacts({
          filter: [{ identities: { identifier: { correlationId: filteredUniqueVC.uniformVerifiableCredential!.issuerDid } } }],
        })
        const subjectPartyIdentity = await agent.cmGetContacts({
          filter: [{ identities: { identifier: { correlationId: filteredUniqueVC.uniformVerifiableCredential!.subjectDid } } }],
        })

        selectableCredentials.push({
          credential: filteredUniqueVC,
          credentialBranding: filteredCredentialBrandings[0]?.localeBranding,
          issuerParty: issuerPartyIdentity?.[0],
          subjectParty: subjectPartyIdentity?.[0],
        })
      }
    }
    selectableCredentialsMap.set(inputDescriptor.id, selectableCredentials)
  }
  return selectableCredentialsMap
}

export const translateCorrelationIdToName = async (correlationId: string, context: RequiredContext): Promise<string | undefined> => {
  const { agent } = context

  const contacts = await agent.cmGetContacts({
    filter: [{ identities: { identifier: { correlationId } } }],
  })

  if (contacts.length === 0) {
    return undefined
  }

  return contacts[0].contact.displayName
}
