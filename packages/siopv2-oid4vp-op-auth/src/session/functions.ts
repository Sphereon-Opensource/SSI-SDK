import {
  CheckLinkedDomain,
  OP,
  OPBuilder,
  PassBy,
  PresentationSignCallback,
  ResponseMode,
  SigningAlgo,
  SupportedVersion,
} from '@sphereon/did-auth-siop'
import { Format } from '@sphereon/pex-models'
import { determineKid, getAgentDIDMethods, getAgentResolver, getKey } from '@sphereon/ssi-sdk-ext.did-utils'
import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk.core'
import { createPEXPresentationSignCallback } from '@sphereon/ssi-sdk.presentation-exchange'
import { IVerifyCallbackArgs, IVerifyCredentialResult } from '@sphereon/wellknown-dids-client'
import { TKeyType } from '@veramo/core'
import { EventEmitter } from 'events'
import { IIdentifierOpts, IOPOptions, IRequiredContext } from '../types/IDidAuthSiopOpAuthenticator'

export async function createOID4VPPresentationSignCallback({
  presentationSignCallback,
  kid,
  domain,
  fetchRemoteContexts,
  challenge,
  format,
  context,
}: {
  presentationSignCallback?: PresentationSignCallback
  kid: string
  domain?: string
  challenge?: string
  fetchRemoteContexts?: boolean
  format?: Format
  context: IRequiredContext
}): Promise<PresentationSignCallback> {
  // fixme: Remove once IPresentation in proper form is available in PEX
  // @ts-ignore
  return presentationSignCallback
    ? presentationSignCallback
    : createPEXPresentationSignCallback({ kid, fetchRemoteContexts, domain, challenge, format }, context)

  /*async (args: PresentationSignCallBackParams): Promise<W3CVerifiablePresentation> => {
        const presentation: PresentationPayload = args.presentation as PresentationPayload
        const format = args.presentationDefinition.format

        const vp = await context.agent.createVerifiablePresentation({
          presentation,
          keyRef: kid,
          domain,
          challenge,
          fetchRemoteContexts: true,
          proofFormat: format && (format.ldp || format.ldp_vp) ? 'lds' : 'jwt',
        })
        return vp as W3CVerifiablePresentation
      }*/
}

export async function createOPBuilder({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: IIdentifierOpts
  context: IRequiredContext
}): Promise<OPBuilder> {
  const eventEmitter = opOptions.eventEmitter ?? new EventEmitter()
  const builder = OP.builder()
    .withResponseMode(opOptions.responseMode ?? ResponseMode.POST)
    .withSupportedVersions(
      opOptions.supportedVersions ?? [
        SupportedVersion.SIOPv2_ID1,
        SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1,
        SupportedVersion.SIOPv2_D11,
        SupportedVersion.SIOPv2_D12_OID4VP_D18,
      ]
    )
    .withExpiresIn(opOptions.expiresIn ?? 300)
    .withCheckLinkedDomain(opOptions.checkLinkedDomains ?? CheckLinkedDomain.IF_PRESENT)
    .withCustomResolver(
      opOptions.resolveOpts?.resolver ??
        getAgentResolver(context, {
          uniresolverResolution: opOptions.resolveOpts?.noUniversalResolverFallback !== true,
          localResolution: true,
          resolverResolution: true,
        })
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
      await createOID4VPPresentationSignCallback({
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
