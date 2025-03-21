import { AuthorizationRequest, SupportedVersion } from '@sphereon/did-auth-siop'
import { IPresentationDefinition, PEX } from '@sphereon/pex'
import { InputDescriptorV1, InputDescriptorV2, PresentationDefinitionV1, PresentationDefinitionV2 } from '@sphereon/pex-models'
import { isOID4VCIssuerIdentifier, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { UniqueDigitalCredential, verifiableCredentialForRoleFilter } from '@sphereon/ssi-sdk.credential-store'
import { ConnectionType, CredentialRole } from '@sphereon/ssi-sdk.data-store'
import { CredentialMapper, HasherSync, Loggers, OriginalVerifiableCredential, PresentationSubmission } from '@sphereon/ssi-types'
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
import { defaultHasher, encodeJoseBlob } from '@sphereon/ssi-sdk.core'
import { DcqlCredential, DcqlCredentialPresentation, DcqlPresentation, DcqlQuery } from 'dcql'
import { convertToDcqlCredentials } from '../utils/dcql'
import { getOriginalVerifiableCredential } from '../utils/CredentialUtils'

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
    isFirstParty?: boolean
    hasher?: HasherSync
    dcqlQuery?: DcqlQuery
  },
  context: RequiredContext,
) => {
  const { agent } = context
  const agentContext = { ...context, agent: context.agent as DidAgents }
  let { idOpts, isFirstParty, hasher = defaultHasher } = args

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
    const oid4vp: OID4VP = await session.getOID4VP({ hasher })

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
    const firstVC = firstUniqueDC.uniformVerifiableCredential
    const holder = CredentialMapper.isSdJwtDecodedCredential(firstVC)
      ? firstVC.decodedPayload.cnf?.jwk
        ? //TODO SDK-19: convert the JWK to hex and search for the appropriate key and associated DID
          //doesn't apply to did:jwk only, as you can represent any DID key as a JWK. So whenever you encounter a JWK it doesn't mean it had to come from a did:jwk in the system. It just can always be represented as a did:jwk
          `did:jwk:${encodeJoseBlob(firstVC.decodedPayload.cnf?.jwk)}#0`
        : firstVC.decodedPayload.sub
      : Array.isArray(firstVC.credentialSubject)
        ? firstVC.credentialSubject[0].id
        : firstVC.credentialSubject.id
    if (!digitalCredential.kmsKeyRef) {
      // In case the store does not have the kmsKeyRef lets search for the holder

      if (!holder) {
        return Promise.reject(`No holder found and no kmsKeyRef in DB. Cannot determine identifier to use`)
      }
      try {
        identifier = await session.context.agent.identifierManagedGet({ identifier: holder })
      } catch (e) {
        logger.debug(`Holder DID not found: ${holder}`)
        throw e
      }
    } else if (isOID4VCIssuerIdentifier(digitalCredential.kmsKeyRef)) {
      identifier = await session.context.agent.identifierManagedGetByOID4VCIssuer({
        identifier: firstUniqueDC.digitalCredential.kmsKeyRef,
      })
    } else {
      switch (digitalCredential.subjectCorrelationType) {
        case 'DID':
          identifier = await session.context.agent.identifierManagedGetByDid({
            identifier: digitalCredential.subjectCorrelationId ?? holder,
            kmsKeyRef: digitalCredential.kmsKeyRef,
          })
          break
        // TODO other implementations?
        default:
          if (digitalCredential.subjectCorrelationId?.startsWith('did:') || holder?.startsWith('did:')) {
            identifier = await session.context.agent.identifierManagedGetByDid({
              identifier: digitalCredential.subjectCorrelationId ?? holder,
              kmsKeyRef: digitalCredential.kmsKeyRef,
            })
          } else {
            // Since we are using the kmsKeyRef we will find the KID regardless of the identifier. We set it for later access though
            identifier = await session.context.agent.identifierManagedGetByKid({
              identifier: digitalCredential.subjectCorrelationId ?? holder ?? digitalCredential.kmsKeyRef,
              kmsKeyRef: digitalCredential.kmsKeyRef,
            })
          }
      }
    }

    if (identifier === undefined && idOpts !== undefined && (await hasEbsiClient(request.authorizationRequest))) {
      identifier = await createEbsiIdentifier(agentContext)
    }
    logger.debug(`Identifier`, identifier)

    // TODO Add mdoc support

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

    logger.log(`Definitions and locations:`, JSON.stringify(presentationsAndDefs?.[0]?.verifiablePresentations, null, 2))
    logger.log(`Presentation Submission:`, JSON.stringify(presentationSubmission, null, 2))
    const mergedVerifiablePresentations = presentationsAndDefs?.flatMap((pd) => pd.verifiablePresentations) || []
    return await session.sendAuthorizationResponse({
      ...(presentationsAndDefs && { verifiablePresentations: mergedVerifiablePresentations }),
      ...(presentationSubmission && { presentationSubmission }),
      // todo: Change issuer value in case we do not use identifier. Use key.meta.jwkThumbprint then
      responseSignerOpts: idOpts!,
      isFirstParty,
    })
  } else if (request.dcqlQuery) {
    if (args.verifiableCredentialsWithDefinition !== undefined && args.verifiableCredentialsWithDefinition !== null) {
      const vcs = args.verifiableCredentialsWithDefinition.flatMap((vcd) => vcd.credentials)
      const domain =
        ((await request.authorizationRequest.getMergedProperty('client_id')) as string) ??
        request.issuer ??
        (request.versions.includes(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
          ? 'https://self-issued.me/v2/openid-vc'
          : 'https://self-issued.me/v2')
      logger.debug(`NONCE: ${session.nonce}, domain: ${domain}`)

      const firstUniqueDC = vcs[0]
      if (typeof firstUniqueDC !== 'object' || !('digitalCredential' in firstUniqueDC)) {
        return Promise.reject(Error('SiopMachine only supports UniqueDigitalCredentials for now'))
      }

      let identifier: ManagedIdentifierOptsOrResult
      const digitalCredential = firstUniqueDC.digitalCredential
      const firstVC = firstUniqueDC.uniformVerifiableCredential
      const holder = CredentialMapper.isSdJwtDecodedCredential(firstVC)
        ? firstVC.decodedPayload.cnf?.jwk
          ? //TODO SDK-19: convert the JWK to hex and search for the appropriate key and associated DID
            //doesn't apply to did:jwk only, as you can represent any DID key as a JWK. So whenever you encounter a JWK it doesn't mean it had to come from a did:jwk in the system. It just can always be represented as a did:jwk
            `did:jwk:${encodeJoseBlob(firstVC.decodedPayload.cnf?.jwk)}#0`
          : firstVC.decodedPayload.sub
        : Array.isArray(firstVC.credentialSubject)
          ? firstVC.credentialSubject[0].id
          : firstVC.credentialSubject.id
      if (!digitalCredential.kmsKeyRef) {
        // In case the store does not have the kmsKeyRef lets search for the holder

        if (!holder) {
          return Promise.reject(`No holder found and no kmsKeyRef in DB. Cannot determine identifier to use`)
        }
        try {
          identifier = await session.context.agent.identifierManagedGet({ identifier: holder })
        } catch (e) {
          logger.debug(`Holder DID not found: ${holder}`)
          throw e
        }
      } else if (isOID4VCIssuerIdentifier(digitalCredential.kmsKeyRef)) {
        identifier = await session.context.agent.identifierManagedGetByOID4VCIssuer({
          identifier: firstUniqueDC.digitalCredential.kmsKeyRef,
        })
      } else {
        switch (digitalCredential.subjectCorrelationType) {
          case 'DID':
            identifier = await session.context.agent.identifierManagedGetByDid({
              identifier: digitalCredential.subjectCorrelationId ?? holder,
              kmsKeyRef: digitalCredential.kmsKeyRef,
            })
            break
          // TODO other implementations?
          default:
            // Since we are using the kmsKeyRef we will find the KID regardless of the identifier. We set it for later access though
            identifier = await session.context.agent.identifierManagedGetByKid({
              identifier: digitalCredential.subjectCorrelationId ?? holder ?? digitalCredential.kmsKeyRef,
              kmsKeyRef: digitalCredential.kmsKeyRef,
            })
        }
      }
      console.log(`Identifier`, identifier)

      const dcqlRepresentations: DcqlCredential[] = []
      vcs.forEach((vc: UniqueDigitalCredential | OriginalVerifiableCredential) => {
        const rep = convertToDcqlCredentials(vc, args.hasher)
        if (rep) {
          dcqlRepresentations.push(rep)
        }
      })

      const queryResult = DcqlQuery.query(request.dcqlQuery, dcqlRepresentations)
      const presentation: Record<string, DcqlCredentialPresentation> = {}

      for (const [key, value] of Object.entries(queryResult.credential_matches)) {
        const allMatches = Array.isArray(value) ? value : [value]
        allMatches.forEach((match) => {
          if (match.success) {
            const originalCredential = getOriginalVerifiableCredential(vcs[match.input_credential_index])
            if (!originalCredential) {
              throw new Error(`Index ${match.input_credential_index} out of range in credentials array`)
            }
            presentation[key] =
              (originalCredential as any)['compactSdJwtVc'] !== undefined ? (originalCredential as any).compactSdJwtVc : originalCredential
          }
        })
      }

      const response = session.sendAuthorizationResponse({
        responseSignerOpts: identifier,
        ...{ dcqlQuery: { dcqlPresentation: DcqlPresentation.parse(presentation) } },
      })

      logger.debug(`Response: `, response)

      return response
    }
  }
  throw Error('Presentation Definition or DCQL is required')
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
