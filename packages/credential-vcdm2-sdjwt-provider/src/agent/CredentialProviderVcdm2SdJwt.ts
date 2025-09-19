import {
  type ExternalIdentifierDidOpts,
  ExternalIdentifierResult,
  type IIdentifierResolution,
  isDidIdentifier,
} from '@sphereon/ssi-sdk-ext.identifier-resolution'
import type { IJwtService, JwsHeader, JwsPayload } from '@sphereon/ssi-sdk-ext.jwt-service'
import { signatureAlgorithmFromKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { asArray, intersect, type VerifiableCredentialSP, type VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import {
  type ICanIssueCredentialTypeArgs,
  type ICanVerifyDocumentTypeArgs,
  type ICreateVerifiableCredentialLDArgs,
  type ICreateVerifiablePresentationLDArgs,
  type IVcdmCredentialProvider,
  type IVcdmIssuerAgentContext,
  IVcdmVerifierAgentContext,
  IVerifyCredentialVcdmArgs,
  IVerifyPresentationLDArgs,
  pickSigningKey,
  preProcessCredentialPayload,
  preProcessPresentation,
} from '@sphereon/ssi-sdk.credential-vcdm'
import { CredentialMapper, isVcdm2Credential, type IVerifyResult, type OriginalVerifiableCredential } from '@sphereon/ssi-types'
import type {
  IAgentContext,
  IDIDManager,
  IIdentifier,
  IKey,
  IKeyManager,
  IResolver,
  VerifiableCredential,
  VerificationPolicies,
  VerifierAgentContext,
} from '@veramo/core'

import Debug from 'debug'

import { decodeJWT, JWT_ERROR } from 'did-jwt'

// @ts-ignore
import { normalizeCredential, normalizePresentation, verifyPresentation as verifyPresentationJWT } from 'did-jwt-vc'

import { type Resolvable } from 'did-resolver'

import { SELF_ISSUED_V0_1, SELF_ISSUED_V2, SELF_ISSUED_V2_VC_INTEROP } from '../did-jwt/JWT'
import { getIssuerFromSdJwt, ISDJwtPlugin } from '@sphereon/ssi-sdk.sd-jwt'
// import {validateCredentialPayload} from "did-jwt-vc/src";

const debug = Debug('sphereon:ssi-sdk:credential-vcdm2-sdjwt')

/**
 * A handler that implements the {@link IVcdmCredentialProvider} methods.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class CredentialProviderVcdm2SdJwt implements IVcdmCredentialProvider {
  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.matchKeyForType} */
  matchKeyForType(key: IKey): boolean {
    return this.matchKeyForJWT(key)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.getTypeProofFormat} */
  getTypeProofFormat(): string {
    return 'vc+sd-jwt'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canIssueCredentialType} */
  canIssueCredentialType(args: ICanIssueCredentialTypeArgs): boolean {
    const format = args.proofFormat.toLowerCase()
    // TODO: Create type
    return format === 'vc+sd-jwt' || format === 'vcdm2_sdjwt'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canVerifyDocumentType */
  canVerifyDocumentType(args: ICanVerifyDocumentTypeArgs): boolean {
    const { document } = args
    const jwt = typeof document === 'string' ? document : (<VerifiableCredential>document)?.proof?.jwt
    if (!jwt) {
      return false
    }
    const { payload } = decodeJWT(jwt.split('~')[0])
    return isVcdm2Credential(payload)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiableCredential} */
  async createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP> {
    const { keyRef } = args
    const agent = assertContext(context).agent
    const { credential, issuer } = preProcessCredentialPayload(args)
    if (!isVcdm2Credential(credential)) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential. Context: ' + credential['@context']))
    } else if (!contextHasPlugin<ISDJwtPlugin>(context, 'createSdJwtVc')) {
      return Promise.reject(
        new Error('invalid_argument: SD-JWT plugin not available. Please install @sphereon/ssi-sdk.sd-jwt and configure agent for VCDM2 SD-JWT'),
      )
    }
    let identifier: IIdentifier
    try {
      identifier = await agent.didManagerGet({ did: issuer })
    } catch (e) {
      return Promise.reject(new Error(`invalid_argument: ${credential.issuer} must be a DID managed by this agent. ${e}`))
    }
    const managedIdentifier = await agent.identifierManagedGetByDid({ identifier: identifier.did, kmsKeyRef: keyRef })
    const key = await pickSigningKey({ identifier, kmsKeyRef: keyRef }, context)

    // TODO: Probably wise to give control to caller as well, as some key types allow multiple signature algos
    const alg = (await signatureAlgorithmFromKey({ key })) as string
    debug('Signing VC with', identifier.did, alg)
    credential.issuer = { id: identifier.did }

    const result = await context.agent.createSdJwtVc({
      type: 'vc+sd-jwt',
      credentialPayload: credential,
      resolution: managedIdentifier,
      disclosureFrame: args.opts?.disclosureFrame,
    })

    const jwt = result.credential.split('~')[0]

    // debug(jwt)
    const normalized = normalizeCredential(jwt)
    normalized.proof.jwt = result.credential
    return normalized
  }

  /** {@inheritdoc ICredentialVerifier.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialVcdmArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { credential, policies /*...otherOptions*/ } = args
    const uniform = CredentialMapper.toUniformCredential(credential as OriginalVerifiableCredential)
    // let verifiedCredential: VerifiableCredential
    if (!isVcdm2Credential(uniform)) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential. Context: ' + uniform['@context']))
    } else if (!contextHasPlugin<ISDJwtPlugin>(context, 'createSdJwtVc')) {
      return Promise.reject(
        new Error('invalid_argument: SD-JWT plugin not available. Please install @sphereon/ssi-sdk.sd-jwt and configure agent for VCDM2 SD-JWT'),
      )
    }
    let verificationResult: IVerifyResult = { verified: false }
    let jwt: string | undefined = typeof credential === 'string' ? credential : asArray(uniform.proof)?.[0]?.jwt
    if (!jwt) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential in JOSE format (string)'))
    }

    try {
      const result = await context.agent.verifySdJwtVc({ credential: jwt })
      if (result.payload) {
        verificationResult = {
          verified: true,
          results: [
            {
              credential: credential as OriginalVerifiableCredential,
              verified: true,
              log: [
                {
                  id: 'valid_signature',
                  valid: true,
                },
                {
                  id: 'issuer_did_resolves',
                  valid: true,
                },
              ],
            },
          ],
        }
      }
    } catch (e) {
      verificationResult = { verified: false, error: { message: e.message, errorCode: e.name } }
    }

    policies = {
      ...policies,
      nbf: policies?.nbf ?? policies?.issuanceDate ?? policies?.validFrom,
      iat: policies?.iat ?? policies?.issuanceDate ?? policies?.validFrom,
      exp: policies?.exp ?? policies?.expirationDate ?? policies?.validUntil,
      aud: policies?.aud ?? policies?.audience,
    }
    verificationResult = await verifierSignature({ jwt: jwt.split('~')[0], policies }, context)
    return verificationResult
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiablePresentation} */
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    const { presentation, holder } = preProcessPresentation(args)
    let { domain, challenge, keyRef /* removeOriginalFields, keyRef, now, ...otherOptions*/ } = args

    const agent = assertContext(context).agent

    const managedIdentifier = await agent.identifierManagedGetByDid({ identifier: holder, kmsKeyRef: keyRef })
    const identifier = managedIdentifier.identifier
    const key = await pickSigningKey(
      {
        identifier: managedIdentifier.identifier,
        kmsKeyRef: managedIdentifier.kmsKeyRef,
      },
      context,
    )

    debug('Signing VC with', identifier.did)
    let alg = 'ES256'
    if (key.type === 'Ed25519') {
      alg = 'EdDSA'
    } else if (key.type === 'Secp256k1') {
      alg = 'ES256K'
    }

    const header: JwsHeader = {
      kid: key.meta.verificationMethod.id ?? key.kid,
      alg,
      typ: 'vp+jwt',
      cty: 'vp',
    }
    const payload: JwsPayload = {
      ...presentation,
      ...(domain && { aud: domain }),
      ...(challenge && { nonce: challenge }),
    }

    const jwt = await agent.jwtCreateJwsCompactSignature({
      mode: 'did',
      issuer: managedIdentifier,
      payload,
      protectedHeader: header,
      clientIdScheme: 'did',
    })

    debug(jwt)
    return normalizePresentation(jwt.jwt)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.verifyPresentation} */
  async verifyPresentation(args: IVerifyPresentationLDArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { presentation, domain, challenge, fetchRemoteContexts, policies, ...otherOptions } = args
    let jwt: string
    if (typeof presentation === 'string') {
      jwt = presentation
    } else {
      jwt = asArray(presentation.proof)[0].jwt
    }
    const resolver = {
      resolve: (didUrl: string) =>
        context.agent.resolveDid({
          didUrl,
          options: otherOptions?.resolutionOptions,
        }),
    } as Resolvable

    let audience = domain
    if (!audience) {
      const { payload } = await decodeJWT(jwt)
      if (payload.aud) {
        // automatically add a managed DID as audience if one is found
        const intendedAudience = asArray(payload.aud)
        const managedDids = await context.agent.didManagerFind()
        const filtered = managedDids.filter((identifier) => intendedAudience.includes(identifier.did))
        if (filtered.length > 0) {
          audience = filtered[0].did
        }
      }
    }

    let message, errorCode
    try {
      const result = await verifyPresentationJWT(jwt, resolver, {
        challenge,
        domain,
        audience,
        policies: {
          ...policies,
          nbf: policies?.nbf ?? policies?.issuanceDate,
          iat: policies?.iat ?? policies?.issuanceDate,
          exp: policies?.exp ?? policies?.expirationDate,
          aud: policies?.aud ?? policies?.audience,
        },
        ...otherOptions,
      })
      if (result) {
        /**
         * {id: 'valid_signature', valid: true},
         *   //   {id: 'issuer_did_resolves', valid: true},
         *   //   {id: 'expiration', valid: true},
         *   //   {id: 'revocation_status', valid: true},
         *   //   {id: 'suspension_status', valid: true}
         */
        return {
          verified: true,
          results: [
            {
              verified: true,
              presentation: result.verifiablePresentation,
              log: [
                {
                  id: 'valid_signature',
                  valid: true,
                },
              ],
            },
          ],
        } satisfies IVerifyResult
      }
    } catch (e: any) {
      message = e.message
      errorCode = e.errorCode
    }
    return {
      verified: false,
      error: {
        message,
        errorCode: errorCode ? errorCode : message?.split(':')[0],
      },
    }
  }

  /**
   * Checks if a key is suitable for signing JWT payloads.
   * @param key - the key to check
   * @param context - the Veramo agent context, unused here
   *
   * @beta
   */
  matchKeyForJWT(key: IKey): boolean {
    switch (key.type) {
      case 'Ed25519':
      case 'Secp256r1':
        return true
      case 'Secp256k1':
        return intersect(key.meta?.algorithms ?? [], ['ES256K', 'ES256K-R']).length > 0
      default:
        return false
    }
  }

  wrapSigner(context: IAgentContext<Pick<IKeyManager, 'keyManagerSign'>>, key: IKey, algorithm?: string) {
    return async (data: string | Uint8Array): Promise<string> => {
      const result = await context.agent.keyManagerSign({ keyRef: key.kid, data: <string>data, algorithm })
      return result
    }
  }
}

export async function verifierSignature(
  { jwt, policies }: { jwt: string; policies: VerificationPolicies /*resolver: Resolvable*/ },
  verifierContext: VerifierAgentContext,
): Promise<IVerifyResult> {
  let credIssuer: string | undefined = undefined
  const context = assertContext(verifierContext)
  const agent = context.agent
  const { payload, header /*signature, data*/ } = decodeJWT(jwt)



  if (!payload.issuer) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT iss or client_id are required`)
  }
  const issuer = getIssuerFromSdJwt(payload)
  if (issuer === SELF_ISSUED_V2 || issuer === SELF_ISSUED_V2_VC_INTEROP) {
    if (!payload.credentialSubject.id) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT credentialSubject.id is required`)
    }
    if (typeof payload.sub_jwk === 'undefined') {
      credIssuer = payload.sub
    } else {
      credIssuer = (header.kid || '').split('#')[0]
    }
  } else if (issuer === SELF_ISSUED_V0_1) {
    if (!payload.did) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT did is required`)
    }
    credIssuer = payload.did
  } else if (!issuer && payload.scope === 'openid' && payload.redirect_uri) {
    // SIOP Request payload
    // https://identity.foundation/jwt-vc-presentation-profile/#self-issued-op-request-object
    if (!payload.client_id) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT client_id is required`)
    }
    credIssuer = payload.client_id
  } else if (issuer?.indexOf('did:') === 0) {
    credIssuer = issuer
  } else if (header.kid?.indexOf('did:') === 0) {
    // OID4VCI expects iss to be the client and kid, to be the DID VM
    credIssuer = (header.kid || '').split('#')[0]
  } else if (typeof payload.issuer === 'string') {
    credIssuer = payload.issuer
  } else if (payload.issuer?.id) {
    credIssuer = payload.issuer.id
  }

  if (!credIssuer) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: No DID has been found in the JWT`)
  }
  let resolution: ExternalIdentifierResult | undefined = undefined
  try {
    resolution = await agent.identifierExternalResolve({ identifier: credIssuer })
  } catch (e: any) {}
  const credential = CredentialMapper.toUniformCredential(jwt)

  const validFromError =
    policies.nbf !== false &&
    policies.iat !== false &&
    'validFrom' in credential &&
    !!credential.validFrom &&
    Date.parse(credential.validFrom) > new Date().getTime()
  const expired =
    policies.exp !== false && 'validUntil' in credential && !!credential.validUntil && Date.parse(credential.validUntil) < new Date().getTime()

  const didOpts = { method: 'did', identifier: credIssuer } satisfies ExternalIdentifierDidOpts
  const jwtResult = await agent.jwtVerifyJwsSignature({
    jws: jwt,
    // @ts-ignore
    jwk: resolution?.jwks[0].jwk,
    opts: { ...(isDidIdentifier(credIssuer) && { did: didOpts }) },
  })
  const error = jwtResult.error || expired || !resolution
  const errorMessage = expired
    ? 'Credential is expired'
    : validFromError
      ? 'Credential is not valid yet'
      : !resolution
        ? `Issuer ${credIssuer} could not be resolved`
        : jwtResult.message

  if (error) {
    const log = [
      {
        id: 'valid_signature',
        valid: !jwtResult.error,
      },
      { id: 'issuer_did_resolves', valid: resolution != undefined },
      { id: 'validFrom', valid: policies.nbf !== false && !validFromError },
      { id: 'expiration', valid: policies.exp !== false && !expired },
    ]
    return {
      verified: false,
      error: { message: errorMessage, errorCode: jwtResult.name },
      log,
      results: [
        {
          verified: false,
          credential: jwt,
          log,
          error: { message: errorMessage, errorCode: jwtResult.name },
        },
      ],
      payload,
      didResolutionResult: resolution,
      jwt,
    } satisfies IVerifyResult
  }

  const log = [
    {
      id: 'valid_signature',
      valid: true,
    },
    {
      id: 'issuer_did_resolves',
      valid: true,
    },
    {
      id: 'validFrom',
      valid: true,
    },
    {
      id: 'expiration',
      valid: true,
    },
  ]
  return {
    verified: true,
    log,
    results: [
      {
        verified: true,
        credential,
        log,
      },
    ],
    payload,
    didResolutionResult: resolution,
    jwt,
  } satisfies IVerifyResult
}

/*
export async function verifyDIDJWT(
  jwt: string,
  options: JWTVerifyOptions = {
    resolver: undefined,
    auth: undefined,
    audience: undefined,
    callbackUrl: undefined,
    skewTime: undefined,
    proofPurpose: undefined,
    policies: {},
  },
  verifierContext: VerifierAgentContext,
): Promise<JWTVerified> {
  const context = assertContext(verifierContext)
  const agent = context.agent
  if (!options.resolver) throw new Error('missing_resolver: No DID resolver has been configured')
  const { payload, header, signature, data }: JWTDecoded = decodeJWT(jwt)
  const proofPurpose: ProofPurposeTypes | undefined = Object.prototype.hasOwnProperty.call(options, 'auth')
    ? options.auth
      ? 'authentication'
      : undefined
    : options.proofPurpose

  let credIssuer: string | undefined = undefined

  if (!payload.iss && !payload.client_id) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT iss or client_id are required`)
  }

  if (payload.iss === SELF_ISSUED_V2 || payload.iss === SELF_ISSUED_V2_VC_INTEROP) {
    if (!payload.sub) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT sub is required`)
    }
    if (typeof payload.sub_jwk === 'undefined') {
      credIssuer = payload.sub
    } else {
      credIssuer = (header.kid || '').split('#')[0]
    }
  } else if (payload.iss === SELF_ISSUED_V0_1) {
    if (!payload.did) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT did is required`)
    }
    credIssuer = payload.did
  } else if (!payload.iss && payload.scope === 'openid' && payload.redirect_uri) {
    // SIOP Request payload
    // https://identity.foundation/jwt-vc-presentation-profile/#self-issued-op-request-object
    if (!payload.client_id) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT client_id is required`)
    }
    credIssuer = payload.client_id
  } else if (payload.iss?.indexOf('did:') === 0) {
    credIssuer = payload.iss
  } else if (header.kid?.indexOf('did:') === 0) {
    // OID4VCI expects iss to be the client and kid, to be the DID VM
    credIssuer = (header.kid || '').split('#')[0]
  } else if (payload.iss) {
    credIssuer = payload.iss
  }

  if (!credIssuer) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: No DID has been found in the JWT`)
  }

  const resolution = await agent.identifierExternalResolve({ identifier: credIssuer })

  const didOpts = { method: 'did', identifier: credIssuer } satisfies ExternalIdentifierDidOpts
  const jwtResult = await agent.jwtVerifyJwsSignature({
    jws: jwt,
    // @ts-ignore
    jwk: resolution.jwks[0],
    opts: { ...(isDidIdentifier(credIssuer) && { did: didOpts }) },
  })

  if (jwtResult.error) {
    return Promise.reject(Error(`Error validating credential: ${jwtResult.error}`))
  }
  const { didResolutionResult, authenticators, issuer }: DIDAuthenticator = await resolveAuthenticator(
    options.resolver,
    header.alg,
    credIssuer,
    proofPurpose,
  )
  const signer: VerificationMethod = verifyJWSDecoded({ header, data, signature } as JWSDecoded, authenticators)
  const now: number = typeof options.policies?.now === 'number' ? options.policies.now : Math.floor(Date.now() / 1000)
  const skewTime = typeof options.skewTime !== 'undefined' && options.skewTime >= 0 ? options.skewTime : NBF_SKEW
  if (signer) {
    const nowSkewed = now + skewTime
    if (options.policies?.nbf !== false && payload.nbf) {
      if (payload.nbf > nowSkewed) {
        throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT not valid before nbf: ${payload.nbf}`)
      }
    } else if (options.policies?.iat !== false && payload.iat && payload.iat > nowSkewed) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT not valid yet (issued in the future) iat: ${payload.iat}`)
    }
    if (options.policies?.exp !== false && payload.exp && payload.exp <= now - skewTime) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT has expired: exp: ${payload.exp} < now: ${now}`)
    }
    if (options.policies?.aud !== false && payload.aud) {
      if (!options.audience && !options.callbackUrl) {
        throw new Error(`${JWT_ERROR.INVALID_AUDIENCE}: JWT audience is required but your app address has not been configured`)
      }
      const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
      const matchedAudience = audArray.find((item: any) => options.audience === item || options.callbackUrl === item)

      if (typeof matchedAudience === 'undefined') {
        throw new Error(`${JWT_ERROR.INVALID_AUDIENCE}: JWT audience does not match your DID or callback url`)
      }
    }
    return { verified: true, payload, didResolutionResult, issuer, signer, jwt, policies: options.policies }
  }
  throw new Error(
    `${JWT_ERROR.INVALID_SIGNATURE}: JWT not valid. issuer DID document does not contain a verificationMethod that matches the signature.`,
  )
}

function verifyJWSDecoded({ header, data, signature }: JWSDecoded, pubKeys: VerificationMethod | VerificationMethod[]): VerificationMethod {
  if (!Array.isArray(pubKeys)) pubKeys = [pubKeys]
  const signer: VerificationMethod = VerifierAlgorithm(header.alg)(data, signature, pubKeys)
  return signer
}


export function validateCredentialPayload(payload: CredentialPayload): void {
  validateContext(asArray(payload['@context']))
  validateVcType(payload.type)
  validateCredentialSubject(payload.credentialSubject)
  if (payload.validFrom) validateTimestamp(payload.validFrom)
  if (payload.validUntil) validateTimestamp(payload.validUntil)
}

export function validateContext(value: string | string[]): void {
  const input = asArray(value)
  if (input.length < 1 || input.indexOf(VCDM_CREDENTIAL_CONTEXT_V2) === -1) {
    throw new TypeError(`${VC_ERROR.SCHEMA_ERROR}: @context is missing default context "${VCDM_CREDENTIAL_CONTEXT_V2}"`)
  }
}
*/
function assertContext(
  context: IVcdmIssuerAgentContext | IVcdmVerifierAgentContext,
): IAgentContext<
  IResolver & IDIDManager & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'> & IJwtService & IIdentifierResolution
> {
  if (!contextHasPlugin<IJwtService>(context, 'jwtPrepareJws')) {
    throw Error(
      'JwtService plugin not found, which is required for JWT signing in the VCDM2 SD-JWT credential provider. Please add the JwtService plugin to your agent configuration.',
    )
  } else if (!contextHasPlugin<IIdentifierResolution>(context, 'identifierManagedGet')) {
    throw Error(
      'Identifier resolution plugin not found, which is required for JWT signing in the VCDM2 SD-JWT credential provider. Please add the JwtService plugin to your agent configuration.',
    )
  }
  return context as IAgentContext<
    IResolver & IDIDManager & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'> & IJwtService & IIdentifierResolution
  >
}
