import { OP, OPBuilder, PassBy, PresentationSignCallback, ResponseMode, SupportedVersion, VerifyJwtCallback } from '@sphereon/did-auth-siop'
import { Format } from '@sphereon/pex-models'
// import { getAgentDIDMethods, getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { isManagedIdentifierDidOpts, isManagedIdentifierDidResult, ManagedIdentifierOpts } from '@sphereon/ssi-sdk-ext.identifier-resolution'
// import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk.core'
import { createPEXPresentationSignCallback } from '@sphereon/ssi-sdk.presentation-exchange'
// import { IVerifyCallbackArgs, IVerifyCredentialResult } from '@sphereon/wellknown-dids-client'
import { TKeyType } from '@veramo/core'
import { EventEmitter } from 'events'
import { IOPOptions, IRequiredContext } from '../types'
import { SigningAlgo } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { Resolvable } from 'did-resolver'
import { JWTVerifyOptions } from 'did-jwt'
import { IVerifyCallbackArgs, IVerifyCredentialResult, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { getAgentDIDMethods } from '@sphereon/ssi-sdk-ext.did-utils'
import { getAudience, getResolver, verifyDidJWT } from '@sphereon/did-auth-siop-adapter'

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
  idOpts: ManagedIdentifierOpts
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

  return createPEXPresentationSignCallback(
    {
      idOpts,
      fetchRemoteContexts,
      domain,
      challenge,
      format,
      skipDidResolution,
    },
    context,
  )
}

export async function createOPBuilder({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: ManagedIdentifierOpts
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
    .withEventEmitter(eventEmitter)
    .withRegistration({
      passBy: PassBy.VALUE,
    })

  const methods = opOptions.supportedDIDMethods ?? (await getAgentDIDMethods(context))
  const resolver = getResolver({ subjectSyntaxTypesSupported: methods })

  const wellknownDIDVerifyCallback = opOptions.wellknownDIDVerifyCallback
    ? opOptions.wellknownDIDVerifyCallback
    : async (args: IVerifyCallbackArgs): Promise<IVerifyCredentialResult> => {
        const result = await context.agent.verifyCredential({ credential: args.credential, fetchRemoteContexts: true })
        return { verified: result.verified }
      }
  builder.withVerifyJwtCallback(
    opOptions.verifyJwtCallback
      ? opOptions.verifyJwtCallback
      : getVerifyJwtCallback(resolver, {
          wellknownDIDVerifyCallback,
          checkLinkedDomain: 'if_present',
        }),
  )
  if (idOpts) {
    if (opOptions.skipDidResolution && isManagedIdentifierDidOpts(idOpts)) {
      idOpts.offlineWhenNoDIDRegistered = true
    }
    const resolution = await context.agent.identifierManagedGet(idOpts)
    if (!isManagedIdentifierDidOpts(idOpts) || !isManagedIdentifierDidResult(resolution)) {
      /*last part is only there to get the available properties of a DID result*/
      // Remove this once we use the newer version
      return Promise.reject(Error(`The current version of SIOP-OID4VP we use only works with DIDs`))
    }

    /*const key = resolution.key
    builder.withSuppliedSignature(
      SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo),
      resolution.did,
      resolution.kid,
      getSigningAlgo(key.type),
    )*/
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

function getVerifyJwtCallback(
  resolver?: Resolvable,
  verifyOpts?: JWTVerifyOptions & {
    checkLinkedDomain: 'never' | 'if_present' | 'always'
    wellknownDIDVerifyCallback?: VerifyCallback
  },
): VerifyJwtCallback {
  return async (jwtVerifier, jwt) => {
    resolver = resolver ?? getResolver({ subjectSyntaxTypesSupported: ['ethr', 'ion'] })
    const audience =
      jwtVerifier.type === 'request-object' || jwtVerifier.type === 'id-token' ? (verifyOpts?.audience ?? getAudience(jwt.raw)) : undefined

    await verifyDidJWT(jwt.raw, resolver, { audience, ...verifyOpts })
    return true
  }
}

export async function createOP({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: ManagedIdentifierOpts
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
