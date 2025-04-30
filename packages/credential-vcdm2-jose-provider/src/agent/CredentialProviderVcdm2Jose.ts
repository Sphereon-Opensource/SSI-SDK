import type {
  IAgentContext,
  IDIDManager,
  IIdentifier,
  IKey,
  IKeyManager,
  IResolver,
  IVerifyResult,
  VerifiableCredential,
  VerifierAgentContext,
} from '@veramo/core'
import {
  type ICanIssueCredentialTypeArgs,
  type ICanVerifyDocumentTypeArgs,
  type ICreateVerifiableCredentialLDArgs,
  type ICreateVerifiablePresentationLDArgs,
  type IVcdmCredentialProvider,
  type IVcdmIssuerAgentContext,
  IVcdmVerifierAgentContext,
  IVerifyCredentialLDArgs,
  IVerifyPresentationLDArgs,
  pickSigningKey,
  preProcessCredentialPayload,
  preProcessPresentation,
} from '@sphereon/ssi-sdk.credential-vcdm'

// @ts-ignore
import { normalizeCredential, normalizePresentation, verifyPresentation as verifyPresentationJWT } from 'did-jwt-vc'

import { type Resolvable } from 'did-resolver'

import { decodeJWT, JWT_ERROR } from 'did-jwt'

import Debug from 'debug'
import { asArray, intersect, VerifiableCredentialSP, VerifiablePresentationSP } from '@sphereon/ssi-sdk.core'
import { contextHasPlugin } from '@sphereon/ssi-sdk.agent-config'
import { IJwtService, JwsHeader, JwsPayload } from '@sphereon/ssi-sdk-ext.jwt-service'
import { ExternalIdentifierDidOpts, IIdentifierResolution, isDidIdentifier } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { CredentialMapper, isVcdm2Credential, OriginalVerifiableCredential } from '@sphereon/ssi-types'

import { SELF_ISSUED_V0_1, SELF_ISSUED_V2, SELF_ISSUED_V2_VC_INTEROP } from '../did-jwt/JWT'
// import {validateCredentialPayload} from "did-jwt-vc/src";

const debug = Debug('sphereon:ssi-sdk:credential-jwt')

/**
 * A handler that implements the {@link IVcdmCredentialProvider} methods.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export class CredentialProviderVcdm2Jose implements IVcdmCredentialProvider {
  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.matchKeyForType} */
  matchKeyForType(key: IKey): boolean {
    return this.matchKeyForJWT(key)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.getTypeProofFormat} */
  getTypeProofFormat(): string {
    return 'vc+jwt'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canIssueCredentialType} */
  canIssueCredentialType(args: ICanIssueCredentialTypeArgs): boolean {
    const format = args.proofFormat.toLowerCase()
    // TODO: Create type
    return format === 'vc+jwt' || format === 'vcdm2_jose' || format === 'vcdm_jose' || format === 'jose'
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.canVerifyDocumentType */
  canVerifyDocumentType(args: ICanVerifyDocumentTypeArgs): boolean {
    const { document } = args
    const jwt = typeof document === 'string' ? document : (<VerifiableCredential>document)?.proof?.jwt
    if (!jwt) {
      return false
    }
    const { payload } = decodeJWT(jwt)
    return isVcdm2Credential(payload)
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiableCredential} */
  async createVerifiableCredential(args: ICreateVerifiableCredentialLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiableCredentialSP> {
    const { keyRef } = args
    const agent = assertContext(context).agent
    const { credential, issuer } = preProcessCredentialPayload(args)
    if (!isVcdm2Credential(credential)) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential. Context: ' + credential['@context']))
    }
    let identifier: IIdentifier
    try {
      identifier = await agent.didManagerGet({ did: issuer })
    } catch (e) {
      throw new Error(`invalid_argument: ${credential.issuer} must be a DID managed by this agent. ${e}`)
    }
    const managedIdentifier = await agent.identifierManagedGetByDid({ identifier: identifier.did, kmsKeyRef: keyRef })
    const key = await pickSigningKey({ identifier, kmsKeyRef: keyRef }, context)

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
      typ: 'vc+jwt',
      cty: 'vc',
    }

    const jwt = await context.agent.jwtCreateJwsCompactSignature({
      mode: 'did',
      issuer: managedIdentifier,
      payload: credential,
      protectedHeader: header,
      clientIdScheme: 'did',
    })
    //FIXME: flagging this as a potential privacy leak.
    debug(jwt)
    return normalizeCredential(jwt.jwt)
  }

  /** {@inheritdoc ICredentialVerifier.verifyCredential} */
  async verifyCredential(args: IVerifyCredentialLDArgs, context: VerifierAgentContext): Promise<IVerifyResult> {
    let { credential /*policies, ...otherOptions*/ } = args
    const uniform = CredentialMapper.toUniformCredential(credential as OriginalVerifiableCredential)
    // let verifiedCredential: VerifiableCredential
    if (!isVcdm2Credential(uniform)) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential. Context: ' + credential['@context']))
    }
    let verificationResult: IVerifyResult = { verified: false }
    let jwt: string | undefined = typeof credential === 'string' ? credential : asArray(uniform.proof)?.[0]?.jwt
    if (!jwt) {
      return Promise.reject(new Error('invalid_argument: credential must be a VCDM2 credential in JOSE format (string)'))
    }
    verificationResult = await verifierSignature({ jwt }, context)
    return verificationResult
    /*    let errorCode, message
        const resolver = {
          resolve: (didUrl: string) =>
            context.agent.resolveDid({
              didUrl,
              options: otherOptions?.resolutionOptions,
            }),
        } as Resolvable
        try {
          // needs broader credential as well to check equivalence with jwt
          verificationResult = await verifyCredentialJWT(jwt, resolver, {
            ...otherOptions,
            policies: {
              ...policies,
              nbf: policies?.nbf ?? policies?.issuanceDate,
              iat: policies?.iat ?? policies?.issuanceDate,
              exp: policies?.exp ?? policies?.expirationDate,
              aud: policies?.aud ?? policies?.audience,
            },
          })
          verifiedCredential = verificationResult.verifiableCredential
    
          const nbf = policies?.issuanceDate === false ? false : undefined
          const exp = policies?.expirationDate === false ? false : undefined
          const options = { ...otherOptions, policies: { ...policies, nbf, exp, iat: nbf, format: policies?.format ?? true } }
    
          const verified: Partial<VerifiedCredential> = await verifyDIDJWT(asArray(uniform.proof)[0].jwt, { resolver, ...options }, context)
          verified.verifiableCredential = normalizeCredential(verified.jwt as string, true)
          if (options?.policies?.format !== false) {
            validateCredentialPayload(verified.verifiableCredential)
          }
    
          // if credential was presented with other fields, make sure those fields match what's in the JWT
          if (typeof credential !== 'string' && asArray(credential.proof)[0].type === 'JwtProof2020') {
            const credentialCopy = JSON.parse(JSON.stringify(credential))
            delete credentialCopy.proof.jwt
    
            const verifiedCopy = JSON.parse(JSON.stringify(verifiedCredential))
            delete verifiedCopy.proof.jwt
    
            if (canonicalize(credentialCopy) !== canonicalize(verifiedCopy)) {
              verificationResult.verified = false
              verificationResult.error = new Error('invalid_credential: Credential JSON does not match JWT payload')
            }
          }
        } catch (e: any) {
          errorCode = e.errorCode
          message = e.message
        }
        if (verificationResult.verified) {
          return verificationResult
        }
        return {
          verified: false,
          error: {
            message,
            errorCode: errorCode ? errorCode : message?.split(':')[0],
          },
        }*/
  }

  /** {@inheritdoc @veramo/credential-w3c#AbstractCredentialProvider.createVerifiablePresentation} */
  async createVerifiablePresentation(args: ICreateVerifiablePresentationLDArgs, context: IVcdmIssuerAgentContext): Promise<VerifiablePresentationSP> {
    const { presentation, holder } = preProcessPresentation(args)
    let { domain, challenge, keyRef /* removeOriginalFields, keyRef, now, ...otherOptions*/ } = args

    const agent = assertContext(context).agent

    const managedIdentifier = await agent.identifierManagedGetByDid({ identifier: holder, kmsKeyRef: keyRef })
    const identifier = managedIdentifier.identifier
    const key = await pickSigningKey({ identifier: managedIdentifier.identifier, kmsKeyRef: managedIdentifier.kmsKeyRef }, context)

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
        return {
          verified: true,
          verifiablePresentation: result,
        }
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
  { jwt }: { jwt: string /*resolver: Resolvable*/ },
  verifierContext: VerifierAgentContext,
): Promise<IVerifyResult> {
  let credIssuer: string | undefined = undefined
  const context = assertContext(verifierContext)
  const agent = context.agent
  const { payload, header /*signature, data*/ } = decodeJWT(jwt)

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
    jwk: resolution.jwks[0].jwk,
    opts: { ...(isDidIdentifier(credIssuer) && { did: didOpts }) },
  })

  if (jwtResult.error) {
    return {
      verified: false,
      error: { message: jwtResult.message, errorCode: jwtResult.name },
      payload,
      didResolutionResult: resolution,
      jwt,
    } as IVerifyResult
  }
  return { verified: true, payload, didResolutionResult: resolution, jwt } as IVerifyResult
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
      'JwtService plugin not found, which is required for JWT signing in the VCDM2 Jose credential provider. Please add the JwtService plugin to your agent configuration.',
    )
  } else if (!contextHasPlugin<IIdentifierResolution>(context, 'identifierManagedGet')) {
    throw Error(
      'Identifier resolution plugin not found, which is required for JWT signing in the VCDM2 Jose credential provider. Please add the JwtService plugin to your agent configuration.',
    )
  }
  return context as IAgentContext<
    IResolver & IDIDManager & Pick<IKeyManager, 'keyManagerGet' | 'keyManagerSign' | 'keyManagerVerify'> & IJwtService & IIdentifierResolution
  >
}
