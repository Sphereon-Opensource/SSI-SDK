import { OP, OPBuilder, PassBy, PresentationSignCallback, ResponseMode, SupportedVersion, VerifyJwtCallback } from '@sphereon/did-auth-siop'
import { Format } from '@sphereon/pex-models'
// import { getAgentDIDMethods, getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { isManagedIdentifierDidOpts, isManagedIdentifierDidResult, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
// import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk.core'
import { createPEXPresentationSignCallback } from '@sphereon/ssi-sdk.presentation-exchange'
import { TKeyType } from '@veramo/core'
import { EventEmitter } from 'events'
import { IOPOptions, IRequiredContext } from '../types'
import { SigningAlgo } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { Resolvable } from 'did-resolver'
import { JWTHeader, JWTVerifyOptions } from 'did-jwt'
import { IVerifyCallbackArgs, IVerifyCredentialResult, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { getAgentDIDMethods } from '@sphereon/ssi-sdk-ext.did-utils'
import { getResolver } from '@sphereon/did-auth-siop-adapter'
import { CreateJwtCallback, JwtHeader, JwtPayload } from '@sphereon/oid4vc-common'
import { JwsCompactResult } from '@sphereon/ssi-sdk-ext.jwt-service'

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
  idOpts: ManagedIdentifierOptsOrResult
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
  idOpts?: ManagedIdentifierOptsOrResult
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
    // builder.withCreateJwtCallback(signCallback(resolution, context))
    const createJwtCallback = signCallback(idOpts, context)
    builder.withCreateJwtCallback(createJwtCallback as unknown as CreateJwtCallback<any>)
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

export function signCallback(
  idOpts: ManagedIdentifierOptsOrResult,
  context: IRequiredContext,
): (jwt: { header: JwtHeader; payload: JwtPayload }) => Promise<string> {
  return async (jwt: { header: JwtHeader; payload: JwtPayload }) => {
    const jwk = jwt.header.jwk

    const resolution = await context.agent.identifierManagedGet(idOpts)
    const issuer = jwt.payload.iss || (isManagedIdentifierDidResult(resolution) ? resolution.did : resolution.issuer)
    if (!issuer) {
      return Promise.reject(Error(`No issuer could be determined from the JWT ${JSON.stringify(jwt)}`))
    }
    let kid = resolution.kid
    const header = { ...jwt.header, ...(kid && !jwk && { kid }) } as Partial<JWTHeader>
    const payload = { ...jwt.payload, ...(issuer && { iss: issuer }) }
    if (jwk && header.kid) {
      delete header.kid
    }

    const result: JwsCompactResult = await context.agent.jwtCreateJwsCompactSignature({
      issuer: { identifier: issuer, noIdentifierInHeader: false },
      protectedHeader: header,
      payload,
    })
    return result.jwt
  }
}

function getVerifyJwtCallback(
  resolver?: Resolvable,
  verifyOpts?: JWTVerifyOptions & {
    checkLinkedDomain: 'never' | 'if_present' | 'always'
    wellknownDIDVerifyCallback?: VerifyCallback
  },
): VerifyJwtCallback {
  return async (jwtVerifier, jwt) => {
    //fixme: SPRIND-49 for actually verifying the jwt value here
    return true
  }
}

export async function createOP({
  opOptions,
  idOpts,
  context,
}: {
  opOptions: IOPOptions
  idOpts?: ManagedIdentifierOptsOrResult
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
