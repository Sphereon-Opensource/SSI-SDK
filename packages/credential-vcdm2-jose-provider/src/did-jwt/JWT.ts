import canonicalizeData from 'canonicalize'
import { type DIDDocument, type DIDResolutionResult, parse, type ParsedDID, type Resolvable, type VerificationMethod } from 'did-resolver'
import SignerAlg from './SignerAlgorithm'
import { decodeBase64url, type EcdsaSignature, encodeBase64url, type KNOWN_JWA, SUPPORTED_PUBLIC_KEY_TYPES } from './util'
import VerifierAlgorithm from './VerifierAlgorithm'
import { JWT_ERROR } from 'did-jwt'

export type Signer = (data: string | Uint8Array) => Promise<EcdsaSignature | string>
export type SignerAlgorithm = (payload: string, signer: Signer) => Promise<string>

export type ProofPurposeTypes =
  | 'assertionMethod'
  | 'authentication'
  // | 'keyAgreement' // keyAgreement VerificationMethod should not be used for signing
  | 'capabilityDelegation'
  | 'capabilityInvocation'

export interface JWTOptions {
  issuer: string
  signer: Signer
  /**
   * @deprecated Please use `header.alg` to specify the JWT algorithm.
   */
  alg?: string
  expiresIn?: number
  canonicalize?: boolean
}

export interface JWTVerifyOptions {
  /** @deprecated Please use `proofPurpose: 'authentication' instead` */
  auth?: boolean
  audience?: string
  callbackUrl?: string
  resolver?: Resolvable
  skewTime?: number
  /** See https://www.w3.org/TR/did-spec-registries/#verification-relationships */
  proofPurpose?: ProofPurposeTypes
  policies?: JWTVerifyPolicies
  didAuthenticator?: DIDAuthenticator
}

/**
 * Overrides the different types of checks performed on the JWT besides the signature check
 */
export interface JWTVerifyPolicies {
  // overrides the timestamp against which the validity interval is checked
  now?: number
  // when set to false, the timestamp checks ignore the Not Before(`nbf`) property
  nbf?: boolean
  // when set to false, the timestamp checks ignore the Issued At(`iat`) property
  iat?: boolean
  // when set to false, the timestamp checks ignore the Expires At(`exp`) property
  exp?: boolean
  // when set to false, the JWT audience check is skipped
  aud?: boolean
}

export interface JWSCreationOptions {
  canonicalize?: boolean
}

export interface DIDAuthenticator {
  authenticators: VerificationMethod[]
  issuer: string
  didResolutionResult: DIDResolutionResult
}

export interface JWTHeader {
  typ: 'JWT'
  alg: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export interface JWTPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  iat?: number
  nbf?: number
  exp?: number
  rexp?: number

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export interface JWTDecoded {
  header: JWTHeader
  payload: JWTPayload
  signature: string
  data: string
}

export interface JWSDecoded {
  header: JWTHeader
  payload: string
  signature: string
  data: string
}

/**
 * Result object returned by {@link verifyJWT}
 */
export interface JWTVerified {
  /**
   * Set to true for a JWT that passes all the required checks minus any verification overrides.
   */
  verified: true

  /**
   * The decoded JWT payload
   */
  payload: Partial<JWTPayload>

  /**
   * The result of resolving the issuer DID
   */
  didResolutionResult: DIDResolutionResult

  /**
   * the issuer DID
   */
  issuer: string

  /**
   * The public key of the issuer that matches the JWT signature
   */
  signer: VerificationMethod

  /**
   * The original JWT that was verified
   */
  jwt: string

  /**
   * Any overrides that were used during verification
   */
  policies?: JWTVerifyPolicies
}

export const SELF_ISSUED_V2 = 'https://self-issued.me/v2'
export const SELF_ISSUED_V2_VC_INTEROP = 'https://self-issued.me/v2/openid-vc' // https://identity.foundation/jwt-vc-presentation-profile/#id-token-validation
export const SELF_ISSUED_V0_1 = 'https://self-issued.me'

type LegacyVerificationMethod = { publicKey?: string }

const defaultAlg: KNOWN_JWA = 'ES256K'
const DID_JSON = 'application/did+json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encodeSection(data: any, shouldCanonicalize = false): string {
  if (shouldCanonicalize) {
    return encodeBase64url(<string>canonicalizeData(data))
  } else {
    return encodeBase64url(JSON.stringify(data))
  }
}

export const NBF_SKEW = 300

function decodeJWS(jws: string): JWSDecoded {
  const parts = jws.match(/^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/)
  if (parts) {
    return {
      header: JSON.parse(decodeBase64url(parts[1])),
      payload: parts[2],
      signature: parts[3],
      data: `${parts[1]}.${parts[2]}`,
    }
  }
  throw new Error('invalid_argument: Incorrect format JWS')
}

/**
 *  Decodes a JWT and returns an object representing the payload
 *
 *  @example
 *  decodeJWT('eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1...')
 *
 *  @param    {String}            jwt                a JSON Web Token to verify
 * @param    {Object}            [recurse]          whether to recurse into the payload to decode any nested JWTs
 *  @return   {Object}                               a JS object representing the decoded JWT
 */
export function decodeJWT(jwt: string, recurse = true): JWTDecoded {
  if (!jwt) throw new Error('invalid_argument: no JWT passed into decodeJWT')
  try {
    const jws = decodeJWS(jwt)
    const decodedJwt: JWTDecoded = Object.assign(jws, { payload: JSON.parse(decodeBase64url(jws.payload)) })
    const iss = decodedJwt.payload.iss

    if (decodedJwt.header.cty === 'JWT' && recurse) {
      const innerDecodedJwt = decodeJWT(decodedJwt.payload.jwt)

      if (innerDecodedJwt.payload.iss !== iss) throw new Error(`${JWT_ERROR.INVALID_JWT}: multiple issuers`)
      return innerDecodedJwt
    }
    return decodedJwt
  } catch (e) {
    throw new Error(`invalid_argument: ${JWT_ERROR.INVALID_JWT}: ${e}`)
  }
}

/**
 *  Creates a signed JWS given a payload, a signer, and an optional header.
 *
 *  @example
 *  const signer = ES256KSigner(process.env.PRIVATE_KEY)
 *  const jws = await createJWS({ my: 'payload' }, signer)
 *
 *  @param    {Object}            payload           payload object
 *  @param    {Signer}            signer            a signer, see `ES256KSigner or `EdDSASigner`
 *  @param    {Object}            header            optional object to specify or customize the JWS header
 *  @param    {Object}            options           can be used to trigger automatic canonicalization of header and
 *                                                    payload properties
 *  @return   {Promise<string>}                     a Promise which resolves to a JWS string or rejects with an error
 */
export async function createJWS(
  payload: string | Partial<JWTPayload>,
  signer: Signer,
  header: Partial<JWTHeader> = {},
  options: JWSCreationOptions = {},
): Promise<string> {
  if (!header.alg) header.alg = defaultAlg
  const encodedPayload = typeof payload === 'string' ? payload : encodeSection(payload, options.canonicalize)
  const signingInput: string = [encodeSection(header, options.canonicalize), encodedPayload].join('.')

  const jwtSigner: SignerAlgorithm = SignerAlg(header.alg)
  const signature: string = await jwtSigner(signingInput, signer)

  // JWS Compact Serialization
  // https://www.rfc-editor.org/rfc/rfc7515#section-7.1
  return [signingInput, signature].join('.')
}

/**
 *  Creates a signed JWT given an address which becomes the issuer, a signer, and a payload for which the signature is
 * over.
 *
 *  @example
 *  const signer = ES256KSigner(process.env.PRIVATE_KEY)
 *  createJWT({address: '5A8bRWU3F7j3REx3vkJ...', signer}, {key1: 'value', key2: ..., ... }).then(jwt => {
 *      ...
 *  })
 *
 *  @param    {Object}            payload               payload object
 *  @param    {Object}            [options]             an unsigned credential object
 *  @param    {String}            options.issuer        The DID of the issuer (signer) of JWT
 *  @param    {String}            options.alg           [DEPRECATED] The JWT signing algorithm to use. Supports:
 *   [ES256K, ES256K-R, Ed25519, EdDSA], Defaults to: ES256K. Please use `header.alg` to specify the algorithm
 *  @param    {Signer}            options.signer        a `Signer` function, Please see `ES256KSigner` or `EdDSASigner`
 *  @param    {boolean}           options.canonicalize  optional flag to canonicalize header and payload before signing
 *  @param    {Object}            header                optional object to specify or customize the JWT header
 *  @return   {Promise<Object, Error>}                  a promise which resolves with a signed JSON Web Token or
 *   rejects with an error
 */
export async function createJWT(
  payload: Partial<JWTPayload>,
  { issuer, signer, alg, expiresIn, canonicalize }: JWTOptions,
  header: Partial<JWTHeader> = {},
): Promise<string> {
  if (!signer) throw new Error('missing_signer: No Signer functionality has been configured')
  if (!issuer) throw new Error('missing_issuer: No issuing DID has been configured')
  if (!header.typ) header.typ = 'JWT'
  if (!header.alg) header.alg = alg
  const timestamps: Partial<JWTPayload> = {
    iat: Math.floor(Date.now() / 1000),
    exp: undefined,
  }
  if (expiresIn) {
    if (typeof expiresIn === 'number') {
      timestamps.exp = <number>(payload.nbf || timestamps.iat) + Math.floor(expiresIn)
    } else {
      throw new Error('invalid_argument: JWT expiresIn is not a number')
    }
  }
  const fullPayload = { ...timestamps, ...payload, iss: issuer }
  return createJWS(fullPayload, signer, header, { canonicalize })
}

/**
 *  Creates a multi-signature signed JWT given multiple issuers and their corresponding signers, and a payload for
 * which the signature is over.
 *
 *  @example
 *  const signer = ES256KSigner(process.env.PRIVATE_KEY)
 *  createJWT({address: '5A8bRWU3F7j3REx3vkJ...', signer}, {key1: 'value', key2: ..., ... }).then(jwt => {
 *      ...
 *  })
 *
 *  @param    {Object}            payload               payload object
 *  @param    {Object}            [options]             an unsigned credential object
 *  @param    {boolean}           options.expiresIn     optional flag to denote the expiration time
 *  @param    {boolean}           options.canonicalize  optional flag to canonicalize header and payload before signing
 *  @param    {Object[]}          issuers               array of the issuers, their signers and algorithms
 *  @param    {string}            issuers[].issuer      The DID of the issuer (signer) of JWT
 *  @param    {Signer}            issuers[].signer      a `Signer` function, Please see `ES256KSigner` or `EdDSASigner`
 *  @param    {String}            issuers[].alg         [DEPRECATED] The JWT signing algorithm to use. Supports:
 *   [ES256K, ES256K-R, Ed25519, EdDSA], Defaults to: ES256K. Please use `header.alg` to specify the algorithm
 *  @return   {Promise<Object, Error>}                  a promise which resolves with a signed JSON Web Token or
 *   rejects with an error
 */
export async function createMultisignatureJWT(
  payload: Partial<JWTPayload>,
  { expiresIn, canonicalize }: Partial<JWTOptions>,
  issuers: { issuer: string; signer: Signer; alg: string }[],
): Promise<string> {
  if (issuers.length === 0) throw new Error('invalid_argument: must provide one or more issuers')

  let payloadResult: Partial<JWTPayload> = payload

  let jwt = ''
  for (let i = 0; i < issuers.length; i++) {
    const issuer = issuers[i]

    const header: Partial<JWTHeader> = {
      typ: 'JWT',
      alg: issuer.alg,
    }

    // Create nested JWT
    // See Point 5 of https://www.rfc-editor.org/rfc/rfc7519#section-7.1
    // After the first JWT is created (the first JWS), the next JWT is created by inputting the previous JWT as the
    // payload
    if (i !== 0) {
      header.cty = 'JWT'
    }

    jwt = await createJWT(payloadResult, { ...issuer, canonicalize, expiresIn }, header)

    payloadResult = { jwt }
  }
  return jwt
}

export function verifyJWTDecoded(
  { header, payload, data, signature }: JWTDecoded,
  pubKeys: VerificationMethod | VerificationMethod[],
): VerificationMethod {
  if (!Array.isArray(pubKeys)) pubKeys = [pubKeys]

  const iss = payload.iss
  let recurse = true
  do {
    if (iss !== payload.iss) throw new Error(`${JWT_ERROR.INVALID_JWT}: multiple issuers`)

    try {
      const result = VerifierAlgorithm(header.alg)(data, signature, pubKeys)

      return result
    } catch (e) {
      if (!(e as Error).message.startsWith(JWT_ERROR.INVALID_SIGNATURE)) throw e
    }

    // TODO probably best to create copy objects than replace reference objects
    if (header.cty !== 'JWT') {
      recurse = false
    } else {
      ;({ payload, header, signature, data } = decodeJWT(payload.jwt, false))
    }
  } while (recurse)

  throw new Error(`${JWT_ERROR.INVALID_SIGNATURE}: no matching public key found`)
}

export function verifyJWSDecoded({ header, data, signature }: JWSDecoded, pubKeys: VerificationMethod | VerificationMethod[]): VerificationMethod {
  if (!Array.isArray(pubKeys)) pubKeys = [pubKeys]
  const signer: VerificationMethod = VerifierAlgorithm(header.alg)(data, signature, pubKeys)
  return signer
}

/**
 *  Verifies given JWS. If the JWS is valid, returns the public key that was
 *  used to sign the JWS, or throws an `Error` if none of the `pubKeys` match.
 *
 *  @example
 *  const pubKey = verifyJWS('eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1Z....', { publicKeyHex: '0x12341...' })
 *
 *  @param    {String}                          jws         A JWS string to verify
 *  @param    {Array<VerificationMethod> | VerificationMethod}    pubKeys     The public keys used to verify the JWS
 *  @return   {VerificationMethod}                       The public key used to sign the JWS
 */
export function verifyJWS(jws: string, pubKeys: VerificationMethod | VerificationMethod[]): VerificationMethod {
  const jwsDecoded: JWSDecoded = decodeJWS(jws)
  return verifyJWSDecoded(jwsDecoded, pubKeys)
}

/**
 *  Verifies given JWT. If the JWT is valid, the promise returns an object including the JWT, the payload of the JWT,
 *  and the DID document of the issuer of the JWT.
 *
 *  @example
 *  ```ts
 *  verifyJWT(
 *      'did:uport:eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1Z....',
 *      {audience: '5A8bRWU3F7j3REx3vkJ...', callbackUrl: 'https://...'}
 *    ).then(obj => {
 *        const did = obj.did // DID of signer
 *        const payload = obj.payload
 *        const doc = obj.didResolutionResult.didDocument // DID Document of issuer
 *        const jwt = obj.jwt
 *        const signerKeyId = obj.signer.id // ID of key in DID document that signed JWT
 *        ...
 *    })
 *  ```
 *
 *  @param    {String}            jwt                a JSON Web Token to verify
 *  @param    {Object}            [options]           an unsigned credential object
 *  @param    {Boolean}           options.auth        Require signer to be listed in the authentication section of the
 *   DID document (for Authentication purposes)
 *  @param    {String}            options.audience    DID of the recipient of the JWT
 *  @param    {String}            options.callbackUrl callback url in JWT
 *  @return   {Promise<Object, Error>}               a promise which resolves with a response object or rejects with an
 *   error
 */
export async function verifyJWT(
  jwt: string,
  options: JWTVerifyOptions = {
    resolver: undefined,
    auth: undefined,
    audience: undefined,
    callbackUrl: undefined,
    skewTime: undefined,
    proofPurpose: undefined,
    policies: {},
    didAuthenticator: undefined,
  },
): Promise<JWTVerified> {
  if (!options.resolver) throw new Error('missing_resolver: No DID resolver has been configured')
  const { payload, header /*, signature, data*/ }: JWTDecoded = decodeJWT(jwt, false)
  const proofPurpose: ProofPurposeTypes | undefined = Object.prototype.hasOwnProperty.call(options, 'auth')
    ? options.auth
      ? 'authentication'
      : undefined
    : options.proofPurpose

  let didUrl: string | undefined

  if (!payload.iss && !payload.client_id) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT iss or client_id are required`)
  }

  if (options.didAuthenticator) {
    didUrl = options.didAuthenticator.issuer
  } else if (payload.iss === SELF_ISSUED_V2 || payload.iss === SELF_ISSUED_V2_VC_INTEROP) {
    if (!payload.sub) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT sub is required`)
    }
    if (typeof payload.sub_jwk === 'undefined') {
      didUrl = payload.sub
    } else {
      didUrl = (header.kid || '').split('#')[0]
    }
  } else if (payload.iss === SELF_ISSUED_V0_1) {
    if (!payload.did) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT did is required`)
    }
    didUrl = payload.did
  } else if (!payload.iss && payload.scope === 'openid' && payload.redirect_uri) {
    // SIOP Request payload
    // https://identity.foundation/jwt-vc-presentation-profile/#self-issued-op-request-object
    if (!payload.client_id) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT client_id is required`)
    }
    didUrl = payload.client_id
  } else {
    didUrl = payload.iss
  }

  if (!didUrl) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: No DID has been found in the JWT`)
  }

  let authenticators: VerificationMethod[]
  let issuer: string
  let didResolutionResult: DIDResolutionResult
  if (options.didAuthenticator) {
    ;({ didResolutionResult, authenticators, issuer } = options.didAuthenticator)
  } else {
    ;({ didResolutionResult, authenticators, issuer } = await resolveAuthenticator(options.resolver, header.alg, didUrl, proofPurpose))
    // Add to options object for recursive reference
    options.didAuthenticator = { didResolutionResult, authenticators, issuer }
  }

  const { did } = parse(didUrl) as ParsedDID

  let signer: VerificationMethod | null = null

  if (did !== didUrl) {
    const authenticator = authenticators.find((auth) => auth.id === didUrl)
    if (!authenticator) {
      throw new Error(`${JWT_ERROR.INVALID_JWT}: No authenticator found for did URL ${didUrl}`)
    }

    // signer = await verifyProof(jwt, { payload, header, signature, data }, authenticator, options)
  } else {
    let i = 0
    while (!signer && i < authenticators.length) {
      // const authenticator = authenticators[i]
      try {
        // signer = await verifyProof(jwt, { payload, header, signature, data }, authenticator, options)
      } catch (e) {
        if (!(e as Error).message.includes(JWT_ERROR.INVALID_SIGNATURE) || i === authenticators.length - 1) throw e
      }

      i++
    }
  }

  if (signer) {
    const now: number = typeof options.policies?.now === 'number' ? options.policies.now : Math.floor(Date.now() / 1000)
    const skewTime = typeof options.skewTime !== 'undefined' && options.skewTime >= 0 ? options.skewTime : NBF_SKEW

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
      const matchedAudience = audArray.find((item) => options.audience === item || options.callbackUrl === item)

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

/**
 * Resolves relevant public keys or other authenticating material used to verify signature from the DID document of
 * provided DID
 *
 *  @example
 *  ```ts
 *  resolveAuthenticator(resolver, 'ES256K', 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX').then(obj => {
 *      const payload = obj.payload
 *      const profile = obj.profile
 *      const jwt = obj.jwt
 *      // ...
 *  })
 *  ```
 *
 *  @param resolver - {Resolvable} a DID resolver function that can obtain the `DIDDocument` for the `issuer`
 *  @param alg - {String} a JWT algorithm
 *  @param issuer - {String} a Decentralized Identifier (DID) to lookup
 *  @param proofPurpose - {ProofPurposeTypes} *Optional* Use the verificationMethod linked in that section of the
 *   issuer DID document
 *  @return {Promise<DIDAuthenticator>} a promise which resolves with an object containing an array of authenticators
 *   or rejects with an error if none exist
 */
export async function resolveAuthenticator(
  resolver: Resolvable,
  alg: string,
  issuer: string,
  proofPurpose?: ProofPurposeTypes,
): Promise<DIDAuthenticator> {
  const types: string[] = SUPPORTED_PUBLIC_KEY_TYPES[alg as KNOWN_JWA]
  if (!types || types.length === 0) {
    throw new Error(`${JWT_ERROR.NOT_SUPPORTED}: No supported signature types for algorithm ${alg}`)
  }
  let didResult: DIDResolutionResult

  const result = (await resolver.resolve(issuer, { accept: DID_JSON })) as unknown
  // support legacy resolvers that do not produce DIDResolutionResult
  if (Object.getOwnPropertyNames(result).indexOf('didDocument') === -1) {
    didResult = {
      didDocument: result as DIDDocument,
      didDocumentMetadata: {},
      didResolutionMetadata: { contentType: DID_JSON },
    }
  } else {
    didResult = result as DIDResolutionResult
  }

  if (didResult.didResolutionMetadata?.error || didResult.didDocument == null) {
    const { error, message } = didResult.didResolutionMetadata
    throw new Error(`${JWT_ERROR.RESOLVER_ERROR}: Unable to resolve DID document for ${issuer}: ${error}, ${message || ''}`)
  }

  const getPublicKeyById = (verificationMethods: VerificationMethod[], pubid?: string): VerificationMethod | null => {
    const filtered = verificationMethods.filter(({ id }) => pubid === id)
    return filtered.length > 0 ? filtered[0] : null
  }

  let publicKeysToCheck: VerificationMethod[] = [...(didResult?.didDocument?.verificationMethod || []), ...(didResult?.didDocument?.publicKey || [])]
  if (typeof proofPurpose === 'string') {
    // support legacy DID Documents that do not list assertionMethod
    if (proofPurpose.startsWith('assertion') && !Object.getOwnPropertyNames(didResult?.didDocument).includes('assertionMethod')) {
      didResult.didDocument = { ...(<DIDDocument>didResult.didDocument) }
      didResult.didDocument.assertionMethod = [...publicKeysToCheck.map((pk) => pk.id)]
    }

    publicKeysToCheck = (didResult.didDocument[proofPurpose] || [])
      .map((verificationMethod) => {
        if (typeof verificationMethod === 'string') {
          return getPublicKeyById(publicKeysToCheck, verificationMethod)
        } else if (typeof (<LegacyVerificationMethod>verificationMethod).publicKey === 'string') {
          // this is a legacy format
          return getPublicKeyById(publicKeysToCheck, (<LegacyVerificationMethod>verificationMethod).publicKey)
        } else {
          return <VerificationMethod>verificationMethod
        }
      })
      .filter((key) => key != null) as VerificationMethod[]
  }

  const authenticators: VerificationMethod[] = publicKeysToCheck.filter(({ type }) => types.find((supported) => supported === type))

  if (typeof proofPurpose === 'string' && (!authenticators || authenticators.length === 0)) {
    throw new Error(
      `${JWT_ERROR.NO_SUITABLE_KEYS}: DID document for ${issuer} does not have public keys suitable for ${alg} with ${proofPurpose} purpose`,
    )
  }
  if (!authenticators || authenticators.length === 0) {
    throw new Error(`${JWT_ERROR.NO_SUITABLE_KEYS}: DID document for ${issuer} does not have public keys for ${alg}`)
  }
  return { authenticators, issuer, didResolutionResult: didResult }
}
