import { IPEXOptions, IRequiredContext, IRPOptions, ISIOPDIDOptions } from './types/ISIOPv2RP'
import { EventEmitter } from 'events'
import { AgentDIDResolver, determineKid, getDID, getIdentifier, getKey, getSupportedDIDMethods, IDIDOptions } from '@sphereon/ssi-sdk-ext.did-utils'
import { KeyAlgo, SuppliedSigner } from '@sphereon/ssi-sdk-core'
import {
  CheckLinkedDomain,
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
  SigningAlgo,
  SubjectType,
  SupportedVersion,
} from '@sphereon/did-auth-siop'
import { TKeyType } from '@veramo/core'
import { IVerifyCallbackArgs, IVerifyCredentialResult } from '@sphereon/wellknown-dids-client'
import { IPresentationDefinition } from '@sphereon/pex'

/*
export async function getPresentationDefinitionStore(pexOptions?: IPEXOptions): Promise<IKeyValueStore<IPresentationDefinition> | undefined> {
  if (pexOptions && pexOptions.definitionId) {
    if (!pexOptions.definitionStore) {
      // yes the assignment is ugly, but we want an in-memory fallback and it cannot be re-instantiated every time
      pexOptions.definitionStore = new KeyValueStore({
        namespace: 'definitions',
        store: new Map<string, IPresentationDefinition>(),
      })
    }
    return pexOptions.definitionStore
  }
  return undefined
}
*/

/*
export async function getPresentationDefinition(pexOptions?: IPEXOptions): Promise<IPresentationDefinition | undefined> {
  return pexOptions?.definition
  /!*const store = await getPresentationDefinitionStore(pexOptions)
  return store && pexOptions?.definitionId ? store.get(pexOptions?.definitionId) : undefined*!/
}
*/

export function getRequestVersion(rpOptions: IRPOptions): SupportedVersion {
  if (Array.isArray(rpOptions.supportedVersions) && rpOptions.supportedVersions.length > 0) {
    return rpOptions.supportedVersions[0]
  }
  return SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1
}

function getWellKnownDIDVerifyCallback(didOpts: ISIOPDIDOptions, context: IRequiredContext) {
  return didOpts.wellknownDIDVerifyCallback
    ? didOpts.wellknownDIDVerifyCallback
    : async (args: IVerifyCallbackArgs): Promise<IVerifyCredentialResult> => {
        const result = await context.agent.verifyCredential({ credential: args.credential, fetchRemoteContexts: true })
        return { verified: result.verified }
      }
}

export function getPresentationVerificationCallback(didOpts: IDIDOptions, context: IRequiredContext) {
  async function presentationVerificationCallback(args: any): Promise<PresentationVerificationResult> {
    const result = await context.agent.verifyPresentation({
      presentation: args,
      fetchRemoteContexts: true,
      domain: getDID(didOpts.identifierOpts),
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
  const definition =
    args.definition ??
    (!!pexOpts && pexOpts.definitionId
      ? await context.agent.pexStoreGetDefinition({
          definitionId: pexOpts.definitionId,
          storeId: pexOpts.storeId,
          namespace: pexOpts.storeNamespace,
        })
      : undefined)
  const did = getDID(didOpts.identifierOpts)
  const didMethods = await getSupportedDIDMethods(didOpts, context)
  const identifier = await getIdentifier(didOpts.identifierOpts, context)
  const key = await getKey(identifier, didOpts.identifierOpts.verificationMethodSection, context, didOpts.identifierOpts.kid)
  const kid = determineKid(key, didOpts.identifierOpts)

  const eventEmitter = rpOpts.eventEmitter ?? new EventEmitter()

  const builder = RP.builder({ requestVersion: getRequestVersion(rpOpts) })
    .withScope('openid', PropertyTarget.REQUEST_OBJECT)
    .withResponseMode(rpOpts.responseMode ?? ResponseMode.POST)
    .withResponseType(ResponseType.ID_TOKEN, PropertyTarget.REQUEST_OBJECT)
    .withCustomResolver(
      rpOpts.didOpts.resolveOpts?.resolver ?? new AgentDIDResolver(context, rpOpts.didOpts.resolveOpts?.noUniversalResolverFallback !== false)
    )
    .withClientId(did, PropertyTarget.REQUEST_OBJECT)
    // todo: move to options fill/correct method
    .withSupportedVersions(
      rpOpts.supportedVersions ?? [SupportedVersion.JWT_VC_PRESENTATION_PROFILE_v1, SupportedVersion.SIOPv2_ID1, SupportedVersion.SIOPv2_D11]
    )

    .withEventEmitter(eventEmitter)
    .withSessionManager(rpOpts.sessionManager ?? new InMemoryRPSessionManager(eventEmitter))
    .withClientMetadata(
      {
        //FIXME: All of the below should be configurable. Some should come from builder, some should be determined by the agent
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
      },
      PropertyTarget.REQUEST_OBJECT
    )

    .withCheckLinkedDomain(didOpts.checkLinkedDomains ?? CheckLinkedDomain.IF_PRESENT)
    .withRevocationVerification(RevocationVerification.NEVER)
    .withPresentationVerification(getPresentationVerificationCallback(didOpts, context))

  didMethods.forEach((method) => builder.addDidMethod(method))
  builder.withWellknownDIDVerifyCallback(getWellKnownDIDVerifyCallback(didOpts, context))

  if (definition) {
    builder.withPresentationDefinition({ definition }, PropertyTarget.REQUEST_OBJECT)
  }

  builder.withSuppliedSignature(SuppliedSigner(key, context, getSigningAlgo(key.type) as unknown as KeyAlgo), did, kid, getSigningAlgo(key.type))

  return builder
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
