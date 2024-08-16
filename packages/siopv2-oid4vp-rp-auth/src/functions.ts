import {
  ClientMetadataOpts,
  InMemoryRPSessionManager,
  PassBy,
  PresentationVerificationResult,
  PropertyTarget,
  ResponseMode,
  ResponseType,
  RevocationVerification,
  RP,
  RPBuilder,
  Scope,
  SubjectType,
  SupportedVersion,
  VerifyJwtCallback,
} from '@sphereon/did-auth-siop'
import { IPresentationDefinition } from '@sphereon/pex'
import { getAgentDIDMethods, getAgentResolver } from '@sphereon/ssi-sdk-ext.did-utils'
import { isManagedIdentifierDidResult, ManagedIdentifierOpts } from '@sphereon/ssi-sdk-ext.identifier-resolution'
// import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk.core'
import { TKeyType } from '@veramo/core'
import { EventEmitter } from 'events'
import { IPEXOptions, IRequiredContext, IRPOptions, ISIOPIdentifierOptions } from './types/ISIOPv2RP'
import { SigningAlgo } from '@sphereon/ssi-sdk.siopv2-oid4vp-common'
import { createHash } from 'crypto'
import { getAudience, getResolver, verifyDidJWT } from '@sphereon/did-auth-siop-adapter'
import { Resolvable } from 'did-resolver'
import { JWTHeader, JWTVerifyOptions } from 'did-jwt'
import { IVerifyCallbackArgs, IVerifyCredentialResult, VerifyCallback } from '@sphereon/wellknown-dids-client'
import { CredentialMapper, Hasher } from '@sphereon/ssi-types'
import { IVerifySdJwtPresentationResult } from '@sphereon/ssi-sdk.sd-jwt'
import { JwtHeader, JwtPayload, CreateJwtCallback } from '@sphereon/oid4vc-common'
import { JwsCompactResult } from '@sphereon/ssi-sdk-ext.jwt-service'

export function getRequestVersion(rpOptions: IRPOptions): SupportedVersion {
  if (Array.isArray(rpOptions.supportedVersions) && rpOptions.supportedVersions.length > 0) {
    return rpOptions.supportedVersions[0]
  }
  return SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1
}

function getWellKnownDIDVerifyCallback(siopIdentifierOpts: ISIOPIdentifierOptions, context: IRequiredContext) {
  return siopIdentifierOpts.wellknownDIDVerifyCallback
    ? siopIdentifierOpts.wellknownDIDVerifyCallback
    : async (args: IVerifyCallbackArgs): Promise<IVerifyCredentialResult> => {
        const result = await context.agent.verifyCredential({ credential: args.credential, fetchRemoteContexts: true })
        return { verified: result.verified }
      }
}

export function getPresentationVerificationCallback(idOpts: ManagedIdentifierOpts, context: IRequiredContext) {
  async function presentationVerificationCallback(args: any): Promise<PresentationVerificationResult> {
    if (CredentialMapper.isSdJwtEncoded(args)) {
      const result: IVerifySdJwtPresentationResult = await context.agent.verifySdJwtPresentation({ presentation: args, kb: true })
      // fixme: investigate the correct way to handle this
      return { verified: !!result.payload }
    }
    const result = await context.agent.verifyPresentation({
      presentation: args,
      fetchRemoteContexts: true,
      domain: (await context.agent.identifierManagedGet(idOpts)).kid?.split('#')[0],
    })
    return { verified: result.verified }
  }

  return presentationVerificationCallback
}

export async function createRPBuilder(args: {
  rpOpts: IRPOptions
  pexOpts?: IPEXOptions | undefined
  definition?: IPresentationDefinition
  context: IRequiredContext
}): Promise<RPBuilder> {
  const { rpOpts, pexOpts, context } = args
  const { didOpts } = rpOpts
  let definition: IPresentationDefinition | undefined = args.definition

  if (!definition && pexOpts && pexOpts.definitionId) {
    const presentationDefinitionItems = await context.agent.pdmGetDefinitions({
      filter: [
        {
          definitionId: pexOpts.definitionId,
          version: pexOpts.version,
          tenantId: pexOpts.tenantId,
        },
      ],
    })

    definition = presentationDefinitionItems.length > 0 ? presentationDefinitionItems[0].definitionPayload : undefined
  }

  const didMethods = didOpts.supportedDIDMethods ?? (await getAgentDIDMethods(context))
  const eventEmitter = rpOpts.eventEmitter ?? new EventEmitter()

  const defaultClientMetadata: ClientMetadataOpts = {
    // FIXME: All of the below should be configurable. Some should come from builder, some should be determined by the agent.
    // For now it is either preconfigured or everything passed in as a single object
    idTokenSigningAlgValuesSupported: [SigningAlgo.EDDSA, SigningAlgo.ES256, SigningAlgo.ES256K], // added newly
    requestObjectSigningAlgValuesSupported: [SigningAlgo.EDDSA, SigningAlgo.ES256, SigningAlgo.ES256K], // added newly
    responseTypesSupported: [ResponseType.ID_TOKEN], // added newly
    client_name: 'Sphereon',
    vpFormatsSupported: {
      jwt_vc: { alg: ['EdDSA', 'ES256K'] },
      jwt_vp: { alg: ['ES256K', 'EdDSA'] },
    },
    scopesSupported: [Scope.OPENID_DIDAUTHN],
    subjectTypesSupported: [SubjectType.PAIRWISE],
    subject_syntax_types_supported: didMethods.map((method) => `did:${method}`),
    passBy: PassBy.VALUE,
  }

  const resolution = await context.agent.identifierManagedGet(didOpts.idOpts)
  const resolver =
    rpOpts.didOpts.resolveOpts?.resolver ??
    getAgentResolver(context, {
      resolverResolution: true,
      localResolution: true,
      uniresolverResolution: rpOpts.didOpts.resolveOpts?.noUniversalResolverFallback !== true,
    })
  //todo: probably wise to first look and see if we actually need the hasher to begin with
  let hasher: Hasher | undefined = rpOpts.credentialOpts?.hasher
  if (!rpOpts.credentialOpts?.hasher || typeof rpOpts.credentialOpts?.hasher !== 'function') {
    hasher = (data, algorithm) => createHash(algorithm).update(data).digest()
  }
  const builder = RP.builder({ requestVersion: getRequestVersion(rpOpts) })
    .withScope('openid', PropertyTarget.REQUEST_OBJECT)
    .withResponseMode(rpOpts.responseMode ?? ResponseMode.POST)
    .withResponseType(ResponseType.VP_TOKEN, PropertyTarget.REQUEST_OBJECT)
    .withClientId(
      resolution.issuer ?? (isManagedIdentifierDidResult(resolution) ? resolution.did : resolution.jwkThumbprint),
      PropertyTarget.REQUEST_OBJECT,
    )
    // todo: move to options fill/correct method
    .withSupportedVersions(
      rpOpts.supportedVersions ?? [SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1, SupportedVersion.SIOPv2_ID1, SupportedVersion.SIOPv2_D11],
    )
    .withEventEmitter(eventEmitter)
    .withSessionManager(rpOpts.sessionManager ?? new InMemoryRPSessionManager(eventEmitter))
    .withClientMetadata(rpOpts.clientMetadataOpts ?? defaultClientMetadata, PropertyTarget.REQUEST_OBJECT)
    .withVerifyJwtCallback(
      rpOpts.verifyJwtCallback
        ? rpOpts.verifyJwtCallback
        : getVerifyJwtCallback(resolver, {
            wellknownDIDVerifyCallback: getWellKnownDIDVerifyCallback(rpOpts.didOpts, context),
            checkLinkedDomain: 'if_present',
          }),
    )
    .withRevocationVerification(RevocationVerification.NEVER)
    .withPresentationVerification(getPresentationVerificationCallback(didOpts.idOpts, context))
  if (hasher) {
    builder.withHasher(hasher)
  }
  //fixme: this has been removed in the new version of did-auth-siop
  /*if (!rpOpts.clientMetadataOpts?.subjectTypesSupported) {
    // Do not update in case it is already provided via client metadata opts
    didMethods.forEach((method) => builder.addDidMethod(method))
  }*/
  //fixme: this has been removed in the new version of did-auth-siop
  // builder.withWellknownDIDVerifyCallback(getWellKnownDIDVerifyCallback(didOpts, context))

  if (definition) {
    builder.withPresentationDefinition({ definition }, PropertyTarget.REQUEST_OBJECT)
  }

  //const key = resolution.key
  //fixme: this has been removed in the new version of did-auth-siop
  //builder.withSuppliedSignature(SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo), did, kid, getSigningAlgo(key.type))

  /*if (isManagedIdentifierDidResult(resolution)) {
    //fixme: only accepts dids in version used. New SIOP lib also accepts other types
    builder.withSuppliedSignature(
      SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo),
      resolution.did,
      resolution.kid,
      getSigningAlgo(key.type),
    )
  }*/
  //fixme: signcallback and it's return type are not totally compatible with our CreateJwtCallbackBase
  const createJwtCallback = signCallback(rpOpts.didOpts.idOpts, context)
  builder.withCreateJwtCallback(createJwtCallback as unknown as CreateJwtCallback<any>)
  return builder
}

//fixme: this is written based on OID4VCIHolder.signCallback sync the fixes to this with that function
export function signCallback(
  idOpts: ManagedIdentifierOpts,
  context: IRequiredContext,
): (jwt: { header: JwtHeader; payload: JwtPayload }, kid?: string) => Promise<string> {
  return async (jwt: { header: JwtHeader; payload: JwtPayload }, kid?: string) => {
    const jwk = jwt.header.jwk

    if (!kid) {
      kid = jwt.header.kid
    }
    if (!kid) {
      kid = idOpts.kid
    }
    if (!kid && jwk && 'kid' in jwk) {
      kid = jwk.kid as string
    }

    if (kid && !idOpts.kid) {
      // sync back to id opts
      idOpts.kid = kid.split('#')[0]
    }

    const resolution = await context.agent.identifierManagedGet(idOpts)
    const issuer = jwt.payload.iss || (isManagedIdentifierDidResult(resolution) ? resolution.did : resolution.issuer)
    if (!issuer) {
      return Promise.reject(Error(`No issuer could be determined from the JWT ${JSON.stringify(jwt)}`))
    }
    if (kid && isManagedIdentifierDidResult(resolution) && !kid.startsWith(resolution.did)) {
      // Make sure we create a fully qualified kid
      const hash = kid.startsWith('#') ? '' : '#'
      kid = `${resolution.did}${hash}${kid}`
    }
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
    resolver = resolver ?? getResolver({ subjectSyntaxTypesSupported: ['ethr', 'ion'] })
    const audience =
      jwtVerifier.type === 'request-object' || jwtVerifier.type === 'id-token' ? (verifyOpts?.audience ?? getAudience(jwt.raw)) : undefined

    //todo probably wise to revisit this. this is called verifyDidJWT and expects a did resolver param.
    await verifyDidJWT(jwt.raw, resolver, { audience, ...verifyOpts })
    return true
  }
}

export async function createRP({ rpOptions, context }: { rpOptions: IRPOptions; context: IRequiredContext }): Promise<RP> {
  return (await createRPBuilder({ rpOpts: rpOptions, context })).build()
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
