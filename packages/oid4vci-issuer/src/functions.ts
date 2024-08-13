import { CredentialRequest, IssuerMetadata, Jwt, JwtVerifyResult, OID4VCICredentialFormat } from '@sphereon/oid4vci-common'
import { CredentialDataSupplier, CredentialIssuanceInput, CredentialSignerCallback, VcIssuer, VcIssuerBuilder } from '@sphereon/oid4vci-issuer'
import { getAgentResolver, IDIDOptions } from '@sphereon/ssi-sdk-ext.did-utils'
import { getManagedIdentifier, ManagedIdentifierOpts } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { ICredential, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { DIDDocument, IIdentifier, ProofFormat } from '@veramo/core'
import { CredentialPayload } from '@veramo/core/src/types/vc-data-model'
import { bytesToBase64 } from '@veramo/utils'
import { createJWT, decodeJWT, JWTVerifyOptions, verifyJWT } from 'did-jwt'
import { Resolvable } from 'did-resolver'
import { IIssuerOptions, IRequiredContext } from './types/IOID4VCIIssuer'

export function getJwtVerifyCallback({ verifyOpts }: { verifyOpts?: JWTVerifyOptions }, _context: IRequiredContext) {
  return async (args: { jwt: string; kid?: string }): Promise<JwtVerifyResult<DIDDocument>> => {
    const resolver = getAgentResolver(_context, {
      resolverResolution: true,
      uniresolverResolution: true,
      localResolution: true,
    })
    verifyOpts = { ...verifyOpts, resolver: verifyOpts?.resolver } // Resolver seperately as that is a function
    if (!verifyOpts?.resolver || typeof verifyOpts?.resolver?.resolve !== 'function') {
      verifyOpts.resolver = resolver
    }
    const result = await verifyJWT(args.jwt, verifyOpts)
    if (!result.verified) {
      console.log(`JWT invalid: ${args.jwt}`)
      throw Error('JWT did not verify successfully')
    }
    const jwt = (await decodeJWT(args.jwt)) as Jwt
    const kid = args.kid ?? jwt.header.kid
    if (!kid) {
      throw Error('No kid value found')
    }
    const did = kid.split('#')[0]
    const didResolution = await resolver.resolve(did)
    if (!didResolution || !didResolution.didDocument) {
      throw Error(`Could not resolve did: ${did}, metadata: ${didResolution?.didResolutionMetadata}`)
    }
    const didDocument = didResolution.didDocument
    const alg = jwt.header.alg
    return {
      alg,
      kid,
      did,
      didDocument,
      jwt,
    }
  }
}

/**
 * Converts legacy id opts key refs to the new ManagedIdentifierOpts
 * @param opts
 */
function legacyKeyRefsToIdentifierOpts(opts: { idOpts?: ManagedIdentifierOpts; iss?: string; keyRef?: string; didOpts?: any }) {
  if (!opts.idOpts) {
    console.warn(
      `Legacy idOpts being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`,
    )
    // legacy way
    let kmsKeyRef =
      opts.keyRef ??
      opts.didOpts?.idOpts?.kmsKeyRef ??
      (typeof opts.didOpts?.idOpts.identifier === 'object' ? (opts.didOpts?.idOpts.identifier as IIdentifier).keys[0].kid : undefined)
    if (!kmsKeyRef) {
      throw Error('Key ref is needed for access token signer')
    }
    return {
      kmsKeyRef: opts.keyRef ?? kmsKeyRef,
      identifier: kmsKeyRef,
      issuer: opts.iss,
    } satisfies ManagedIdentifierOpts
  } else {
    const idOpts = opts.idOpts
    if (opts.keyRef && !idOpts.kmsKeyRef) {
      // legacy way
      console.warn(
        `Legacy keyRef being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`,
      )
      idOpts.kmsKeyRef = opts.keyRef
    }
    if (opts.iss && !idOpts.issuer) {
      // legacy way
      console.warn(
        `Legacy iss being used. Support will be dropped in the future. Consider switching to the idOpts, to have support for DIDs, JWKS, x5c etc. See https://github.com/Sphereon-Opensource/SSI-SDK-crypto-extensions/tree/feature/multi_identifier_support/packages/identifier-resolution`,
      )
      idOpts.issuer = opts.iss
    }

    return idOpts
  }
}

export async function getAccessTokenKeyRef(
  opts: {
    /**
     * Uniform identifier options
     */
    idOpts?: ManagedIdentifierOpts
    /**
     * @deprecated
     */
    iss?: string
    /**
     * @deprecated
     */
    keyRef?: string
    /**
     * @deprecated
     */
    didOpts?: IDIDOptions
  },
  context: IRequiredContext,
) {
  let idOpts: ManagedIdentifierOpts
  idOpts = legacyKeyRefsToIdentifierOpts(opts)
  return await context.agent.identifierManagedGet(idOpts)
}

export async function getAccessTokenSignerCallback(
  opts: {
    /**
     * Uniform identifier options
     */
    idOpts?: ManagedIdentifierOpts
    /**
     * @deprecated
     */
    iss?: string
    /**
     * @deprecated
     */
    keyRef?: string
    /**
     * @deprecated
     */
    didOpts?: IDIDOptions
  },
  context: IRequiredContext,
) {
  const signer = async (data: string | Uint8Array) => {
    let dataString, encoding: 'base64' | undefined

    const keyRef = resolution.kmsKeyRef
    if (!keyRef) {
      throw Error('Cannot sign access tokens without a key ref')
    }
    if (typeof data === 'string') {
      dataString = data
      encoding = undefined
    } else {
      dataString = bytesToBase64(data)
      encoding = 'base64'
    }
    return context.agent.keyManagerSign({ keyRef, data: dataString, encoding })
  }

  async function accessTokenSignerCallback(jwt: Jwt, kid?: string): Promise<string> {
    const issuer = opts?.iss ?? opts.didOpts?.idOpts?.identifier.toString()
    if (!issuer) {
      throw Error('No issuer configured for access tokens')
    }
    const result = await createJWT(jwt.payload, { signer, issuer }, { ...jwt.header, typ: 'JWT' })
    return result
  }

  const resolution = await context.agent.identifierManagedGet(legacyKeyRefsToIdentifierOpts(opts))
  return accessTokenSignerCallback
}

export async function getCredentialSignerCallback(
  idOpts: ManagedIdentifierOpts & {
    crypto?: Crypto
  },
  context: IRequiredContext,
): Promise<CredentialSignerCallback<DIDDocument>> {
  async function issueVCCallback(args: {
    credentialRequest: CredentialRequest
    credential: CredentialIssuanceInput
    jwtVerifyResult: JwtVerifyResult<DIDDocument>
    format?: OID4VCICredentialFormat
  }): Promise<W3CVerifiableCredential> {
    const { jwtVerifyResult, format } = args
    const credential = args.credential as ICredential // TODO: SDJWT
    let proofFormat: ProofFormat

    proofFormat = format?.includes('ld') ? 'lds' : 'jwt'
    if (!credential.issuer) {
      credential.issuer = { id: resolution.issuer ?? resolution.kmsKeyRef }
    } else if (typeof credential.issuer === 'object' && !credential.issuer.id) {
      credential.issuer.id = resolution.issuer ?? resolution.kmsKeyRef
    }
    const subjectIsArray = Array.isArray(credential.credentialSubject)
    let credentialSubjects = Array.isArray(credential.credentialSubject) ? credential.credentialSubject : [credential.credentialSubject]
    credentialSubjects = credentialSubjects.map((subject) => {
      if (!subject.id) {
        subject.id = jwtVerifyResult.did
      }
      return subject
    })
    credential.credentialSubject = subjectIsArray ? credentialSubjects : credentialSubjects[0]

    const result = await context.agent.createVerifiableCredential({
      credential: credential as CredentialPayload,
      proofFormat,
      removeOriginalFields: false,
      fetchRemoteContexts: true,
      domain: typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer,
    })
    return (proofFormat === 'jwt' && 'jwt' in result.proof ? result.proof.jwt : result) as W3CVerifiableCredential
  }

  const resolution = await getManagedIdentifier(idOpts, context)

  return issueVCCallback
}

export async function createVciIssuerBuilder(
  args: {
    issuerOpts: IIssuerOptions
    metadata: IssuerMetadata
    resolver?: Resolvable
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext,
): Promise<VcIssuerBuilder<DIDDocument>> {
  const { issuerOpts, metadata } = args

  const builder = new VcIssuerBuilder<DIDDocument>()
  // @ts-ignore
  const resolver =
    args.resolver ??
    args?.issuerOpts?.didOpts?.resolveOpts?.resolver ??
    args.issuerOpts?.didOpts?.resolveOpts?.jwtVerifyOpts?.resolver ??
    getAgentResolver(context)
  if (!resolver) {
    throw Error('A Resolver is necessary to verify DID JWTs')
  }
  const idOpts = legacyKeyRefsToIdentifierOpts({ ...issuerOpts.didOpts, ...issuerOpts.idOpts })
  const jwtVerifyOpts: JWTVerifyOptions = {
    ...issuerOpts?.didOpts?.resolveOpts?.jwtVerifyOpts,
    ...args?.issuerOpts?.resolveOpts?.jwtVerifyOpts,
    resolver,
    audience: metadata.credential_issuer as string, // FIXME legacy version had {display: NameAndLocale | NameAndLocale[]} as credential_issuer
  }
  builder.withIssuerMetadata(metadata)
  // builder.withUserPinRequired(issuerOpts.userPinRequired ?? false) was removed from implementers draft v1
  builder.withCredentialSignerCallback(await getCredentialSignerCallback(idOpts, context))
  builder.withJWTVerifyCallback(getJwtVerifyCallback({ verifyOpts: jwtVerifyOpts }, context))
  if (args.credentialDataSupplier) {
    builder.withCredentialDataSupplier(args.credentialDataSupplier)
  }
  builder.withInMemoryCNonceState()
  builder.withInMemoryCredentialOfferState()
  builder.withInMemoryCredentialOfferURIState()
  builder.build()

  return builder
}

export async function createVciIssuer(
  {
    issuerOpts,
    metadata,
    credentialDataSupplier,
  }: {
    issuerOpts: IIssuerOptions
    metadata: IssuerMetadata
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext,
): Promise<VcIssuer<DIDDocument>> {
  return (await createVciIssuerBuilder({ issuerOpts, metadata, credentialDataSupplier }, context)).build()
}
