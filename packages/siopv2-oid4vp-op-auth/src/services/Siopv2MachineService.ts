import {
  AuthorizationRequest,
  Json,
  SupportedVersion
} from '@sphereon/did-auth-siop'
import { isOID4VCIssuerIdentifier, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { UniqueDigitalCredential, verifiableCredentialForRoleFilter } from '@sphereon/ssi-sdk.credential-store'
import { ConnectionType, CredentialRole } from '@sphereon/ssi-sdk.data-store'
import {
  CredentialMapper,
  HasherSync,
  Loggers,
  OriginalVerifiableCredential,
  SdJwtDecodedVerifiableCredential
} from '@sphereon/ssi-types'
import { OpSession } from '../session'
import {
  LOGGER_NAMESPACE,
  RequiredContext,
  SelectableCredential,
  SelectableCredentialsMap,
  Siopv2HolderEvent
} from '../types'
import { encodeJoseBlob } from '@sphereon/ssi-sdk.core'
import { DcqlPresentation, DcqlQuery } from 'dcql'
import { convertToDcqlCredentials } from '../utils/dcql'
import { IAgentContext, IDIDManager } from '@veramo/core'
import {
  getOrCreatePrimaryIdentifier,
  SupportedDidMethodEnum
} from '@sphereon/ssi-sdk-ext.did-utils'

export const logger = Loggers.DEFAULT.get(LOGGER_NAMESPACE)

// @ts-ignore
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

// @ts-ignore
const hasEbsiClient = async (authorizationRequest: AuthorizationRequest) => {
  const clientId = authorizationRequest.getMergedProperty<string>('client_id')
  const redirectUri = authorizationRequest.getMergedProperty<string>('redirect_uri')
  return clientId?.toLowerCase().includes('.ebsi.eu') || redirectUri?.toLowerCase().includes('.ebsi.eu')
}

export const siopSendAuthorizationResponse = async (
  connectionType: ConnectionType,
  args: {
    sessionId: string
    credentials: Array<UniqueDigitalCredential | OriginalVerifiableCredential>
    idOpts?: ManagedIdentifierOptsOrResult
    isFirstParty?: boolean
    hasher?: HasherSync
  },
  context: RequiredContext,
) => {
  const { agent } = context
  const { credentials } = args
  if (connectionType !== ConnectionType.SIOPv2_OpenID4VP) {
    return Promise.reject(Error(`No supported authentication provider for type: ${connectionType}`))
  }

  const session: OpSession = await agent.siopGetOPSession({ sessionId: args.sessionId })
  const request = await session.getAuthorizationRequest()
  const aud = request.authorizationRequest.getMergedProperty<string>('aud')
  logger.debug(`AUD: ${aud}`)
  logger.debug(JSON.stringify(request.authorizationRequest))

      const domain =
        ((await request.authorizationRequest.getMergedProperty('client_id')) as string) ??
        request.issuer ??
        (request.versions.includes(SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1)
          ? 'https://self-issued.me/v2/openid-vc'
          : 'https://self-issued.me/v2')
      logger.debug(`NONCE: ${session.nonce}, domain: ${domain}`)

      const firstUniqueDC = credentials[0]
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

  const dcqlCredentialsWithCredentials = new Map(
    credentials.map((vc) => [convertToDcqlCredentials(vc), vc])
  )

  const queryResult = DcqlQuery.query(request.dcqlQuery, Array.from(dcqlCredentialsWithCredentials.keys()))

  if (!queryResult.can_be_satisfied) {
    return Promise.reject(Error('Credentials do not match required query request'))
  }

  const presentation: DcqlPresentation.Output = {}
  const uniqueCredentials = Array.from(dcqlCredentialsWithCredentials.values())
  for (const [key, value] of Object.entries(queryResult.credential_matches)) {
    if (value.success) {
      const matchedCredentials = value.valid_credentials.map(cred => uniqueCredentials[cred.input_credential_index])
      const vc = matchedCredentials[0] // taking the first match for now //uniqueCredentials[value.input_credential_index]
      if (!vc) {
        continue
      }
      const originalVc = retrieveEncodedCredential(vc as UniqueDigitalCredential) // TODO this is not nice // also always a UniqueDigitalCredential
      if (!originalVc) {
        continue
      }
      if (originalVc) {
        presentation[key] = originalVc as | string | { [x: string]: Json }
      }
    }
  }

  const dcqlPresentation = DcqlPresentation.parse(presentation)

      const response = session.sendAuthorizationResponse({
        responseSignerOpts: identifier,
        dcqlResponse: {
          dcqlPresentation
        }
      })

      logger.debug(`Response: `, response)
      return response
}

const retrieveEncodedCredential = (credential: UniqueDigitalCredential): OriginalVerifiableCredential | undefined => {
  return credential.originalVerifiableCredential !== undefined &&
    credential.originalVerifiableCredential !== null &&
    (credential?.originalVerifiableCredential as SdJwtDecodedVerifiableCredential)?.compactSdJwtVc !== undefined &&
    (credential?.originalVerifiableCredential as SdJwtDecodedVerifiableCredential)?.compactSdJwtVc !== null
    ? (credential.originalVerifiableCredential as SdJwtDecodedVerifiableCredential).compactSdJwtVc
    : credential.originalVerifiableCredential
}

export const getSelectableCredentials = async (
  dcqlQuery: DcqlQuery,
  context: RequiredContext,
): Promise<SelectableCredentialsMap> => {
  const agentContext = { ...context, agent: context.agent }
  const { agent } = agentContext
  const uniqueVerifiableCredentials = await agent.crsGetUniqueCredentials({
    filter: verifiableCredentialForRoleFilter(CredentialRole.HOLDER),
  })
  const branding = await agent.ibGetCredentialBranding()
  const dcqlCredentialsWithCredentials = new Map(
    uniqueVerifiableCredentials.map((vc) => [convertToDcqlCredentials(vc), vc])
  )
  const queryResult = DcqlQuery.query(dcqlQuery, Array.from(dcqlCredentialsWithCredentials.keys()))
  const uniqueCredentials = Array.from(dcqlCredentialsWithCredentials.values())
  const selectableCredentialsMap: SelectableCredentialsMap = new Map()

  for (const [key, value] of Object.entries(queryResult.credential_matches)) {
    if (!value.valid_credentials) {
      continue
    }

    const mapSelectableCredentialPromises = value.valid_credentials.map(async cred => {
      const matchedCredential = uniqueCredentials[cred.input_credential_index]
      const credentialBranding = branding.filter((cb) => cb.vcHash === matchedCredential.hash)
      const issuerPartyIdentity = await agent.cmGetContacts({
        filter: [{ identities: { identifier: { correlationId: matchedCredential.uniformVerifiableCredential!.issuerDid } } }],
      })
      const subjectPartyIdentity = await agent.cmGetContacts({
        filter: [{ identities: { identifier: { correlationId: matchedCredential.uniformVerifiableCredential!.subjectDid } } }],
      })

      return {
        credential: matchedCredential,
        credentialBranding: credentialBranding[0]?.localeBranding,
        issuerParty: issuerPartyIdentity?.[0],
        subjectParty: subjectPartyIdentity?.[0],
      }
    })

    const selectableCredentials: Array<SelectableCredential> = await Promise.all(mapSelectableCredentialPromises)
    selectableCredentialsMap.set(key, selectableCredentials)
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
