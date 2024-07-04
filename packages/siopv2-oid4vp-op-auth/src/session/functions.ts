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
import { determineKid, getAgentDIDMethods, getAgentResolver, getDID, getIdentifier, getKey, IIdentifierOpts } from '@sphereon/ssi-sdk-ext.did-utils'
import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk.core'
import { createPEXPresentationSignCallback } from '@sphereon/ssi-sdk.presentation-exchange'
import { IVerifyCallbackArgs, IVerifyCredentialResult } from '@sphereon/wellknown-dids-client'
import { TKeyType } from '@veramo/core'
import { EventEmitter } from 'events'
import { IOPOptions, IRequiredContext } from '../types/IDidAuthSiopOpAuthenticator'

export async function createOID4VPPresentationSignCallback({
  presentationSignCallback,
  idOpts,
  domain,
  fetchRemoteContexts,
  challenge,
  format,
  context,
  skipDidResolution,
}: {
  presentationSignCallback?: PresentationSignCallback
  idOpts: IIdentifierOpts
  domain?: string
  challenge?: string
  fetchRemoteContexts?: boolean
  skipDidResolution?: boolean
  format?: Format
  context: IRequiredContext
}): Promise<PresentationSignCallback> {
  if (typeof presentationSignCallback === 'function') {
    return presentationSignCallback
  }

  return createPEXPresentationSignCallback({ idOpts, fetchRemoteContexts, domain, challenge, format, skipDidResolution }, context)
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
    .withResponseMode(opOptions.responseMode ?? ResponseMode.DIRECT_POST)
    .withSupportedVersions(
      opOptions.supportedVersions ?? [
        SupportedVersion.SIOPv2_ID1,
        SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1,
        SupportedVersion.SIOPv2_D11,
        SupportedVersion.SIOPv2_D12_OID4VP_D18,
      ],
    )
    .withExpiresIn(opOptions.expiresIn ?? 300)
    .withCheckLinkedDomain(opOptions.checkLinkedDomains ?? CheckLinkedDomain.IF_PRESENT)
    .withCustomResolver(
      opOptions.resolveOpts?.resolver ??
        getAgentResolver(context, {
          uniresolverResolution: opOptions.resolveOpts?.noUniversalResolverFallback !== true,
          localResolution: true,
          resolverResolution: true,
        }),
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
    const key = await getKey(await getIdentifier(idOpts, context), idOpts.verificationMethodSection, context, idOpts.kid)
    const kid = idOpts.kid?.startsWith('did:') ? idOpts.kid : determineKid(key, idOpts)

    builder.withSuppliedSignature(
      SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo),
      getDID(idOpts),
      kid,
      getSigningAlgo(key.type),
    )
    builder.withPresentationSignCallback(
      await createOID4VPPresentationSignCallback({
        presentationSignCallback: opOptions.presentationSignCallback,
        skipDidResolution: opOptions.skipDidResolution ?? false,
        idOpts,
        context,
      }),
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
