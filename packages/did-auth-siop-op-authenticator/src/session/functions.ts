import { IIdentifierOpts, IOPOptions, IRequiredContext } from '../types/IDidAuthSiopOpAuthenticator'
import { EventEmitter } from 'events'
import { AgentDIDResolver, getAgentDIDMethods, mapIdentifierKeysToDocWithJwkSupport } from '@sphereon/ssi-sdk-did-utils'
import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk-core'
import { W3CVerifiablePresentation } from '@sphereon/ssi-types'
import {
  Builder,
  CheckLinkedDomain,
  OP,
  PassBy,
  PresentationSignCallback,
  ResponseMode,
  SigningAlgo,
  SupportedVersion,
} from '@sphereon/did-auth-siop'
import { PresentationSignCallBackParams } from '@sphereon/pex'
import { DIDDocumentSection, IIdentifier, IKey, PresentationPayload, TKeyType } from '@veramo/core'
import { _ExtendedIKey } from '@veramo/utils'
import { IVerifyCallbackArgs, IVerifyCredentialResult } from '@sphereon/wellknown-dids-client'

export async function createPresentationSignCallback({
  presentationSignCallback,
  kid,
  context,
}: {
  presentationSignCallback?: PresentationSignCallback
  kid: string
  context: IRequiredContext
}): Promise<PresentationSignCallback> {
  return presentationSignCallback
    ? presentationSignCallback
    : async (args: PresentationSignCallBackParams): Promise<W3CVerifiablePresentation> => {
        const presentation: PresentationPayload = args.presentation as PresentationPayload
        const format = args.presentationDefinition.format
        return (await context.agent.createVerifiablePresentation({
          presentation,
          keyRef: kid,
          fetchRemoteContexts: true,
          proofFormat: format && (format.ldp || format.ldp_vp) ? 'lds' : 'jwt',
        })) as W3CVerifiablePresentation
      }
}

export async function createOPBuilder({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: IIdentifierOpts
  context: IRequiredContext
}): Promise<Builder> {
  const eventEmitter = opOptions.eventEmitter ?? new EventEmitter()
  const builder = OP.builder()
    .withResponseMode(opOptions.responseMode ?? ResponseMode.POST)
    .withSupportedVersions(
      opOptions.supportedVersions ?? [SupportedVersion.SIOPv2_ID1, SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1, SupportedVersion.SIOPv2_D11]
    )
    .withExpiresIn(opOptions.expiresIn ?? 300)
    .withCheckLinkedDomain(opOptions.checkLinkedDomains ?? CheckLinkedDomain.IF_PRESENT)
    .withCustomResolver(
      opOptions.resolveOpts?.resolver ?? new AgentDIDResolver(context, opOptions.resolveOpts?.noUniversalResolverFallback !== false)
    )
    .withEventEmitter(eventEmitter)
    .withRegistration({
      passBy: PassBy.VALUE,
    })

  const methods = opOptions.supportedDIDMethods ?? (await getAgentDIDMethods(context))
  methods.forEach((method) => builder.addDidMethod(method))

  const wellknownDIDVerifyCallback = opOptions.wellknownDIDVerifyCallback
    ? opOptions.wellknownDIDVerifyCallback
    : async (args: IVerifyCallbackArgs): Promise<IVerifyCredentialResult> => {
        const result = await context.agent.verifyCredential({ credential: args.credential, fetchRemoteContexts: true })
        return { verified: result.verified }
      }
  builder.withWellknownDIDVerifyCallback(wellknownDIDVerifyCallback)

  if (idOpts && idOpts.identifier) {
    const key = await getKey(idOpts.identifier, idOpts.verificationMethodSection, context, idOpts.kid)
    const kid = determineKid(key, idOpts)

    builder.withSuppliedSignature(
      SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo),
      idOpts.identifier.did,
      kid,
      getSigningAlgo(key.type)
    )
    builder.withPresentationSignCallback(
      await createPresentationSignCallback({
        presentationSignCallback: opOptions.presentationSignCallback,
        kid,
        context,
      })
    )
  }
  return builder
}

export async function createOP({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: IIdentifierOpts
  context: IRequiredContext
}): Promise<OP> {
  return (await createOPBuilder({ opOptions, idOpts, context })).build()
}

export async function getKey(
  identifier: IIdentifier,
  verificationMethodSection: DIDDocumentSection = 'authentication',
  context: IRequiredContext,
  keyId?: string
): Promise<IKey> {
  const keys = await mapIdentifierKeysToDocWithJwkSupport(identifier, verificationMethodSection, context)
  if (!keys || keys.length === 0) {
    throw new Error(`No keys found for verificationMethodSection: ${verificationMethodSection} and did ${identifier.did}`)
  }

  const identifierKey = keyId ? keys.find((key: _ExtendedIKey) => key.kid === keyId || key.meta.verificationMethod.id === keyId) : keys[0]
  if (!identifierKey) {
    throw new Error(`No matching verificationMethodSection key found for keyId: ${keyId}`)
  }

  return identifierKey
}

export function determineKid(key: IKey, idOpts: IIdentifierOpts): string {
  return key.meta?.verificationMethod.id ?? idOpts.kid ?? key.kid
}

export function getSigningAlgo(type: TKeyType): SigningAlgo {
  switch (type) {
    case 'Ed25519':
      return SigningAlgo.EDDSA
    case 'Secp256k1':
      return SigningAlgo.ES256K
    case 'Secp256r1':
      return SigningAlgo.ES256
    // @ts-ignore
    case 'RSA':
      return SigningAlgo.RS256
    default:
      throw Error('Key type not yet supported')
  }
}
