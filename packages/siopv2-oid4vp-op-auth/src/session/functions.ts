import { OP, OPBuilder, PassBy, PresentationSignCallback, ResponseMode, SupportedVersion, VerifyJwtCallback } from '@sphereon/did-auth-siop'
import { CreateJwtCallback, JwtHeader, JwtIssuer, SigningAlgo } from '@sphereon/oid4vc-common'
import { Format } from '@sphereon/pex-models'
import { isManagedIdentifierDidOpts, isManagedIdentifierX5cOpts, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { JwsHeader, JwsPayload, JwtCompactResult } from '@sphereon/ssi-sdk-ext.jwt-service'
import { createPEXPresentationSignCallback } from '@sphereon/ssi-sdk.presentation-exchange'
import { IVerifyCallbackArgs, IVerifyCredentialResult, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { TKeyType } from '@veramo/core'
import { JWTVerifyOptions } from 'did-jwt'
import { Resolvable } from 'did-resolver'
import { EventEmitter } from 'events'
import { IOPOptions, IRequiredContext } from '../types'
import { OriginalVerifiableCredential } from '@sphereon/ssi-types'

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
    .withSupportedVersions(opOptions.supportedVersions ?? [SupportedVersion.OID4VP_v1, SupportedVersion.SIOPv2_OID4VP_D28])
    .withExpiresIn(opOptions.expiresIn ?? 300)
    .withEventEmitter(eventEmitter)
    .withRegistration({
      passBy: PassBy.VALUE,
    })

  const wellknownDIDVerifyCallback = opOptions.wellknownDIDVerifyCallback
    ? opOptions.wellknownDIDVerifyCallback
    : async (args: IVerifyCallbackArgs): Promise<IVerifyCredentialResult> => {
        const result = await context.agent.cvVerifyCredential({
          credential: args.credential as OriginalVerifiableCredential,
          fetchRemoteContexts: true,
        })
        return { verified: result.result }
      }
  builder.withVerifyJwtCallback(
    opOptions.verifyJwtCallback
      ? opOptions.verifyJwtCallback
      : getVerifyJwtCallback(
          {
            verifyOpts: {
              wellknownDIDVerifyCallback,
              checkLinkedDomain: 'if_present',
            },
          },
          context,
        ),
  )
  if (idOpts) {
    if (opOptions.skipDidResolution && isManagedIdentifierDidOpts(idOpts)) {
      idOpts.offlineWhenNoDIDRegistered = true
    }
    const createJwtCallback = createJwtCallbackWithIdOpts(idOpts, context)
    builder.withCreateJwtCallback(createJwtCallback as CreateJwtCallback<any>)
    builder.withPresentationSignCallback(
      await createOID4VPPresentationSignCallback({
        presentationSignCallback: opOptions.presentationSignCallback,
        skipDidResolution: opOptions.skipDidResolution ?? false,
        idOpts,
        context,
      }),
    )
  } else {
    const createJwtCallback = createJwtCallbackWithOpOpts(opOptions, context)
    builder.withCreateJwtCallback(createJwtCallback as CreateJwtCallback<any>)
  }
  return builder
}

export function createJwtCallbackWithIdOpts(
  idOpts: ManagedIdentifierOptsOrResult,
  context: IRequiredContext,
): (jwtIssuer: JwtIssuer, jwt: { header: JwtHeader; payload: JwsPayload }) => Promise<string> {
  return async (jwtIssuer: JwtIssuer, jwt: { header: JwtHeader; payload: JwsPayload }) => {
    let issuer: ManagedIdentifierOptsOrResult & { noIdentifierInHeader: false }

    if (isManagedIdentifierDidOpts(idOpts)) {
      issuer = {
        ...idOpts,
        method: idOpts.method,
        noIdentifierInHeader: false,
      }
    } else if (isManagedIdentifierX5cOpts(idOpts)) {
      issuer = {
        ...idOpts,
        method: idOpts.method,
        noIdentifierInHeader: false,
      }
    } else {
      return Promise.reject(Error(`JWT issuer method ${jwtIssuer.method} not yet supported`))
    }

    const result: JwtCompactResult = await context.agent.jwtCreateJwsCompactSignature({
      issuer,
      protectedHeader: jwt.header as JwsHeader,
      payload: jwt.payload,
    })
    return result.jwt
  }
}

export function createJwtCallbackWithOpOpts(
  opOpts: IOPOptions,
  context: IRequiredContext,
): (jwtIssuer: JwtIssuer, jwt: { header: JwtHeader; payload: JwsPayload }) => Promise<string> {
  return async (jwtIssuer: JwtIssuer, jwt: { header: JwtHeader; payload: JwsPayload }) => {
    let identifier: string | Array<string>
    if (jwtIssuer.method == 'did') {
      identifier = jwtIssuer.didUrl
    } else if (jwtIssuer.method == 'x5c') {
      identifier = jwtIssuer.x5c
    } else {
      return Promise.reject(Error(`JWT issuer method ${jwtIssuer.method} not yet supported`))
    }

    const result: JwtCompactResult = await context.agent.jwtCreateJwsCompactSignature({
      // FIXME fix cose-key inference
      // @ts-ignore
      issuer: { identifier: identifier, kmsKeyRef: idOpts.kmsKeyRef, noIdentifierInHeader: false },
      // FIXME fix JWK key_ops
      // @ts-ignore
      protectedHeader: jwt.header,
      payload: jwt.payload,
    })
    return result.jwt
  }
}

function getVerifyJwtCallback(
  _opts: {
    resolver?: Resolvable
    verifyOpts?: JWTVerifyOptions & {
      checkLinkedDomain: 'never' | 'if_present' | 'always'
      wellknownDIDVerifyCallback?: VerifyCallback
    }
  },
  context: IRequiredContext,
): VerifyJwtCallback {
  return async (jwtVerifier, jwt) => {
    const result = await context.agent.jwtVerifyJwsSignature({ jws: jwt.raw })
    if (result.error) {
      console.log(result.message)
      return false
    }
    // When the verifier authenticates via an X.509 chain (client_id scheme x509_san_dns / x509_hash),
    // strictly validate the request-object x5c chain against the wallet's trust anchors.
    // x509VerifyCertificateChain uses the wallet's runtime trust-anchor registry when no anchors are passed.
    const x5c: string[] | undefined = (jwtVerifier as any)?.x5c
    if (Array.isArray(x5c) && x5c.length > 0) {
      const agent: any = context.agent
      if (typeof agent.x509VerifyCertificateChain === 'function') {
        const x509Result = await agent.x509VerifyCertificateChain({ chain: x5c })
        if (x509Result?.error || !x509Result?.certificateChain) {
          console.log(`OID4VP request object x5c validation failed: ${x509Result?.message ?? 'unknown error'}`)
          return false
        }
      }
    }
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
