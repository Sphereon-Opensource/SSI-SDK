import {
  AuthorizationServerMetadata,
  CredentialRequest,
  IssuerMetadata,
  Jwt,
  JwtVerifyResult,
  OID4VCICredentialFormat,
  StatusListOpts,
} from '@sphereon/oid4vci-common'
import { JWTHeader, JWTPayload } from '@sphereon/oid4vci-common/lib/types'
import { CredentialDataSupplier, CredentialIssuanceInput, CredentialSignerCallback, VcIssuer, VcIssuerBuilder } from '@sphereon/oid4vci-issuer'
import { getAgentResolver, IDIDOptions } from '@sphereon/ssi-sdk-ext.did-utils'
import { legacyKeyRefsToIdentifierOpts, ManagedIdentifierOptsOrResult } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { SdJwtVcPayload } from '@sphereon/ssi-sdk.sd-jwt/dist'
import { IStatusListPlugin } from '@sphereon/ssi-sdk.vc-status-list'
import { CompactSdJwtVc, CredentialMapper, ICredential, W3CVerifiableCredential } from '@sphereon/ssi-types'
import { CredentialPayload, DIDDocument, ProofFormat } from '@veramo/core'
import { bytesToBase64 } from '@veramo/utils'
import { createJWT, decodeJWT, JWTVerifyOptions, verifyJWT } from 'did-jwt'
import { Resolvable } from 'did-resolver'
import { jwtDecode } from 'jwt-decode'
import { IIssuerOptions, IRequiredContext } from './types/IOID4VCIIssuer'
import fetch from 'cross-fetch'
import { AuthorizationResponseStateStatus } from '@sphereon/did-auth-siop'

export function getJwtVerifyCallback({ verifyOpts }: { verifyOpts?: JWTVerifyOptions }, _context: IRequiredContext) {
  return async (args: { jwt: string; kid?: string }): Promise<JwtVerifyResult<DIDDocument>> => {
    const resolver = getAgentResolver(_context, {
      resolverResolution: true,
      uniresolverResolution: true,
      localResolution: true,
    })
    verifyOpts = { ...verifyOpts, resolver: verifyOpts?.resolver } // Resolver separately as that is a function
    if (!verifyOpts?.resolver || typeof verifyOpts?.resolver?.resolve !== 'function') {
      verifyOpts.resolver = resolver
    }
    const result = await _context.agent.jwtVerifyJwsSignature({ jws: args.jwt })
    if (!result.error) {
      const identifier = result.jws.signatures[0].identifier
      if (!identifier) {
        return Promise.reject(Error('the jws did not contain a signature with an identifier'))
      }
      const jwkInfo = identifier.jwks[0]
      if (!jwkInfo) {
        return Promise.reject(Error(`the identifier of type ${identifier.method} is missing jwks (ExternalJwkInfo)`))
      }
      const { alg } = jwkInfo.jwk
      if (!alg) {
        return Promise.reject(Error(`the ExternalJwkInfo of identifier of type ${identifier.method} is missing alg in its jwk`))
      }

      const header = jwtDecode<JWTHeader>(args.jwt, { header: true })
      const payload = jwtDecode<JWTPayload>(args.jwt, { header: false })
      const kid = args.kid ?? header.kid
      const jwk = !kid ? jwkInfo.jwk : undefined // TODO double-check if this is correct
      return {
        alg,
        ...identifier,
        jwt: { header, payload },
        ...(kid && { kid }),
        ...(jwk && { jwk }),
      } as JwtVerifyResult<DIDDocument>
    }

    const decodedJwt = (await decodeJWT(args.jwt)) as Jwt
    const kid = args.kid ?? decodedJwt.header.kid

    if (!kid || !kid.startsWith('did:')) {
      // No DID method present in header. We already performed the validation above. So return that
      return {
        alg: decodedJwt.header.alg,
        jwt: decodedJwt,
      } as JwtVerifyResult<DIDDocument>
    }
    const did = kid.split('#')[0]

    const didResult = await verifyJWT(args.jwt, verifyOpts)
    if (!didResult.verified) {
      console.log(`JWT invalid: ${args.jwt}`)
      throw Error('JWT did not verify successfully')
    }

    const didResolution = await resolver.resolve(did)
    if (!didResolution || !didResolution.didDocument) {
      throw Error(`Could not resolve did: ${did}, metadata: ${didResolution?.didResolutionMetadata}`)
    }

    const alg = decodedJwt.header.alg
    return {
      alg,
      kid,
      did,
      didDocument: didResolution.didDocument,
      jwt: decodedJwt,
    }
  }
}

export async function getAccessTokenKeyRef(
  opts: {
    /**
     * Uniform identifier options
     */
    idOpts?: ManagedIdentifierOptsOrResult
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
  let identifier = legacyKeyRefsToIdentifierOpts(opts)
  return await context.agent.identifierManagedGet(identifier)
}

export async function getAccessTokenSignerCallback(
  opts: {
    /**
     * Uniform identifier options
     */
    idOpts?: ManagedIdentifierOptsOrResult
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

    const resolution = await legacyKeyRefsToIdentifierOpts(opts)
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
    return await createJWT(jwt.payload, { signer, issuer }, { ...jwt.header, typ: 'JWT' })
  }

  return accessTokenSignerCallback
}

export async function getCredentialSignerCallback(
  idOpts: ManagedIdentifierOptsOrResult & {
    crypto?: Crypto
  },
  context: IRequiredContext,
): Promise<CredentialSignerCallback<DIDDocument>> {
  async function issueVCCallback(args: {
    credentialRequest: CredentialRequest
    credential: CredentialIssuanceInput
    jwtVerifyResult: JwtVerifyResult<DIDDocument>
    format?: OID4VCICredentialFormat
    statusLists?: Array<StatusListOpts>
  }): Promise<W3CVerifiableCredential | CompactSdJwtVc> {
    const { jwtVerifyResult, format, statusLists } = args
    const credential = args.credential as ICredential // TODO: SDJWT
    let proofFormat: ProofFormat

    const resolution = await context.agent.identifierManagedGet(idOpts)
    proofFormat = format?.includes('ld') ? 'lds' : 'jwt'
    const issuer = resolution.issuer ?? resolution.kmsKeyRef

    if (CredentialMapper.isW3cCredential(credential)) {
      if (!credential.issuer) {
        credential.issuer = { id: issuer }
      } else if (typeof credential.issuer === 'object' && !credential.issuer.id) {
        credential.issuer.id = issuer
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

      // TODO: We should extend the plugin capabilities of issuance so we do not have to tuck this into the sign callback
      if (contextHasPlugin<IStatusListPlugin>(context, 'slAddStatusToCredential')) {
        // Add status list if enabled (and when the input has a credentialStatus object (can be empty))
        const credentialStatusVC = await context.agent.slAddStatusToCredential({ credential, statusLists: statusLists })
        if (credential.credentialStatus && !credential.credentialStatus.statusListCredential) {
          credential.credentialStatus = credentialStatusVC.credentialStatus
        }
      }

      const result = await context.agent.createVerifiableCredential({
        credential: credential as CredentialPayload,
        proofFormat,
        removeOriginalFields: false,
        fetchRemoteContexts: true,
        domain: typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer,
        ...(resolution.kid && { header: { kid: resolution.kid } }),
      })
      return (proofFormat === 'jwt' && 'jwt' in result.proof ? result.proof.jwt : result) as W3CVerifiableCredential
    } else if (CredentialMapper.isSdJwtDecodedCredentialPayload(credential)) {
      const sdJwtPayload = credential as SdJwtVcPayload
      if (sdJwtPayload.iss === undefined) {
        sdJwtPayload.iss = issuer
      }
      if (sdJwtPayload.iat === undefined) {
        sdJwtPayload.iat = Math.floor(new Date().getTime() / 1000)
      }

      let disclosureFrame
      if ('disclosureFrame' in credential) {
        disclosureFrame = credential['disclosureFrame']
        delete credential['disclosureFrame']
      } else {
        disclosureFrame = {
          _sd: credential['_sd'],
        }
      }

      if (contextHasPlugin<IStatusListPlugin>(context, 'slAddStatusToSdJwtCredential')) {
        if ((sdJwtPayload.status && sdJwtPayload.status.status_list) || (statusLists && statusLists.length > 0)) {
          // Add status list if enabled (and when the input has a credentialStatus object (can be empty))
          const credentialStatusVC = await context.agent.slAddStatusToSdJwtCredential({ credential: sdJwtPayload, statusLists: statusLists })
          if (sdJwtPayload.status?.status_list?.idx) {
            if (!credentialStatusVC.status || !credentialStatusVC.status.status_list) {
              // TODO check, looks like sdJwtPayload and credentialStatusVC is the same
              return Promise.reject(Error('slAddStatusToSdJwtCredential did not return a status_list'))
            }

            sdJwtPayload.status.status_list.idx = credentialStatusVC.status.status_list.idx
          }
        }
      }

      const result = await context.agent.createSdJwtVc({
        credentialPayload: sdJwtPayload,
        disclosureFrame: disclosureFrame,
        resolution,
      })
      return result.credential
    } /*else if (CredentialMapper.isMsoMdocDecodedCredential(credential)) {
      TODO
    }*/
    return Promise.reject('VC issuance failed, an incorrect or unsupported credential was supplied')
  }

  return issueVCCallback
}

export async function createVciIssuerBuilder(
  args: {
    issuerOpts: IIssuerOptions
    issuerMetadata: IssuerMetadata
    authorizationServerMetadata: AuthorizationServerMetadata
    resolver?: Resolvable
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext,
): Promise<VcIssuerBuilder<DIDDocument>> {
  const { issuerOpts, issuerMetadata, authorizationServerMetadata } = args

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
  const idOpts = legacyKeyRefsToIdentifierOpts({ didOpts: issuerOpts.didOpts, idOpts: issuerOpts.idOpts })
  const jwtVerifyOpts: JWTVerifyOptions = {
    ...issuerOpts?.didOpts?.resolveOpts?.jwtVerifyOpts,
    ...args?.issuerOpts?.resolveOpts?.jwtVerifyOpts,
    resolver,
    audience: issuerMetadata.credential_issuer as string, // FIXME legacy version had {display: NameAndLocale | NameAndLocale[]} as credential_issuer
  }
  builder.withIssuerMetadata(issuerMetadata)
  builder.withAuthorizationMetadata(authorizationServerMetadata)
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
    issuerMetadata,
    authorizationServerMetadata,
    credentialDataSupplier,
  }: {
    issuerOpts: IIssuerOptions
    issuerMetadata: IssuerMetadata
    authorizationServerMetadata: AuthorizationServerMetadata
    credentialDataSupplier?: CredentialDataSupplier
  },
  context: IRequiredContext,
): Promise<VcIssuer<DIDDocument>> {
  return (
    await createVciIssuerBuilder(
      {
        issuerOpts,
        issuerMetadata,
        authorizationServerMetadata,
        credentialDataSupplier,
      },
      context,
    )
  ).build()
}

export async function createAuthRequestUriCallback(opts: { path: string; presentationDefinitionId: string }): Promise<() => Promise<string>> {
  async function authRequestUriCallback(): Promise<string> {
    const path = opts.path.replace(':definitionId', opts.presentationDefinitionId)
    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response): Promise<string> => {
      if (response.status >= 400) {
        return Promise.reject(Error(await response.text()))
      } else {
        const responseData = await response.json()

        if (!responseData.authRequestURI) {
          return Promise.reject(Error('Missing auth request uri in response body'))
        }

        return responseData.authRequestURI
      }
    })
  }

  return authRequestUriCallback
}

export async function createVerifyAuthResponseCallback(opts: {
  path: string
  presentationDefinitionId: string
}): Promise<(correlationId: string) => Promise<boolean>> {
  async function verifyAuthResponseCallback(correlationId: string): Promise<boolean> {
    return fetch(opts.path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ definitionId: opts.presentationDefinitionId, correlationId }),
    }).then(async (response): Promise<boolean> => {
      if (response.status >= 400) {
        return Promise.reject(Error(await response.text()))
      } else {
        const responseData = await response.json()

        if (!responseData.status) {
          return Promise.reject(Error('Missing status in response body'))
        }

        return responseData.status === AuthorizationResponseStateStatus.VERIFIED
      }
    })
  }

  return verifyAuthResponseCallback
}
