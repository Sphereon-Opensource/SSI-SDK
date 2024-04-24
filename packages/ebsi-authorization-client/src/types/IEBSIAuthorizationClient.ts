import {IAgentContext, IDIDManager, IKeyManager, IPluginMethodMap} from '@veramo/core'
import {Format, PresentationDefinitionV2, PresentationSubmission} from '@sphereon/pex-models'
import {DiscoveryMetadataPayload} from '@sphereon/did-auth-siop'

/**
 * The OpenID scope
 * @readonly
 * @enum {string}
 */
export enum EBSIScope {
  didr_write = 'didr_write',
  didr_invite = 'didr_invite',
  tir_write = 'tir_write',
  tir_invite = 'tir_invite',
  timestamp_write = 'timestamp_write',
  tnt_authorise = 'tnt_authorise',
  tnt_create = 'tnt_create',
  tnt_write = 'tnt_write',
}

export enum ScopeByDefinition {
  didr_invite_presentation = 'openid didr_invite',
  didr_write_presentation = 'openid didr_write',
  tir_invite_presentation = 'openid tir_invite',
  tir_write_presentation = 'openid tir_write',
  timestamp_write_presentation = 'openid timestamp_write',
  tnt_authorise_presentation = 'openid tnt_authorise',
  tnt_create_presentation = 'openid tnt_create',
  tnt_write_presentation = 'openid tnt_write',
}

export enum TokenType {
  BEARER = 'Bearer',
}

export interface IEBSIAuthorizationClient extends IPluginMethodMap {
  getOIDProviderMetadata(): Promise<GetOIDProviderMetadataResponse>
  getOIDProviderJwks(): Promise<GetOIDProviderJwksResponse>
  getPresentationDefinition(args: GetPresentationDefinitionArgs): Promise<GetPresentationDefinitionResponse>
  getAccessToken(args: GetAccessTokenArgs): Promise<GetAccessTokenResponse>
  initiateSIOPDidAuthRequest(args: InitiateSIOPDidAuthRequestArgs): Promise<InitiateSIOPDidAuthRequestResponse>
  createSIOPSession(args: CreateSIOPSessionArgs): Promise<CreateSIOPSessionResponse>
  createOAuth2Session(args: CreateOAuth2SessionArgs): Promise<CreateOAuth2SessionResponse>
}

/**
 * @typedef GetOIDProviderMetadataSuccessResponse
 * @type {object}
 * @property {(URL | string)} issuer URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier. MUST be identical to the iss Claim value in ID Tokens issued from this Issuer.
 * @property {(URL | string)} authorization_endpoint URL of the OP's OAuth 2.0 Authorization Endpoint.
 * @property {(URL | string)} token_endpoint URL of the OP's OAuth 2.0 Token Endpoint.
 * @property {(URL | string)} [presentation_definition_endpoint] URL of the OP's presentation definitions endpoint. Non-standard, used in EBSI
 * @property {(URL | string)} jwks_uri URL of the authorization server's JWK Set [JWK] document
 * @property {string[]} scopes_supported JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that this server supports. (SIOP v2)
 * @property {string[]} response_types_supported JSON array containing a list of the OAuth 2.0 "response_type" values that this authorization server supports (SIOP v2)
 * @property {string[]} [response_mode_supported] JSON array containing a list of the OAuth 2.0 response_mode values that this OP supports
 * @property {string[]} [grant_types_supported] JSON array containing a list of the OAuth 2.0 grant type values that this authorization server supports.
 * @property {string[]} subject_types_supported JSON array containing a list of the Subject Identifier types that this OP supports.
 * @property {string[]} id_token_signing_alg_values_supported JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for the ID Token to encode the Claims in a JWT
 * @property {string[]} [request_object_signing_alg_values_supported] JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for Request Objects
 * @property {string[]} [request_parameter_supported] Boolean value specifying whether the OP supports use of the request parameter, with true indicating support
 * @property {string[]} [token_endpoint_auth_methods_supported] JSON array containing a list of client authentication methods supported by this token endpoint
 * @property {{ authorization_endpoint: string[] }} [request_authentication_methods_supported] A JSON Object defining the client authentications supported for each endpoint
 * @property {string[]} [vp_formats_supported] An object containing a list of key value pairs, where the key is a string identifying a credential format supported by the AS
 * @property {(URL[] | string[])} [subject_syntax_types_supported]  A JSON array of strings representing URI scheme identifiers and optionally method names of supported Subject Syntax Types
 * @property {string[]} [subject_trust_frameworks_supported] A JSON array of supported trust frameworks.
 * @property {string[]} [id_token_types_supported] A JSON array of strings containing the list of ID Token types supported by the OP
 */
export type GetOIDProviderMetadataSuccessResponse = DiscoveryMetadataPayload & {
  presentation_definition_endpoint?: URL | string
}

/**
 * @typedef Key
 * @type {object}
 * @property {string} [kty]
 * @property {string} [crv]
 * @property {string} [alg]
 * @property {string} [x]
 * @property {string} [y]
 * @property {string} [kid]
 */
export interface Key {
  kty?: string
  crv?: string
  alg?: string
  x?: string
  y?: string
  kid?: string
}

/**
 * JSON Web Key Set
 * @typedef GetOIDProviderJwksSuccessResponse
 * @property {Key[]} keys
 */
export interface GetOIDProviderJwksSuccessResponse {
  keys: Key[]
}

/**
 * @typedef GetPresentationDefinitionArgs
 * @type {object}
 * @property {EBSIScope} scope
 */
export interface GetPresentationDefinitionArgs {
  scope: EBSIScope
}

/**
 * Presentation Definition V2
 * @typedef GetPresentationDefinitionSuccessResponse
 * @type {object}
 * @property {string} id A UUID or some other unique ID to identify this Presentation Definition
 * @property {string} [name] A name property is a human-friendly string intended to constitute a distinctive designation of the Presentation Definition.
 * @property {string} [purpose] It describes the purpose for which the Presentation Definition's inputs are being requested.
 * @property {Format} [format] What claim variants Verifiers and Holders support.
 * @property {SubmissionRequirement[]} [submission_requirements] List of requirements for described inputs in input descriptors.
 * @property {InputDescriptor[]} input_descriptors List of descriptions of the required inputs.
 * @property {object} [frame] a JSON LD Framing Document object.
 */
export type GetPresentationDefinitionSuccessResponse = PresentationDefinitionV2 & {
  format?: Pick<Format, 'jwt_vc' | 'jwt_vc_json' | 'jwt_vp' | 'jwt_vp_json'>
}

/**
 * @typedef GetAccessTokenArgs
 * @type {object}
 * @property {string} grant_type MUST be set to "vp_token"
 * @property {string} vp_token  Signed Verifiable Presentation. See also the VP Token schema definition.
 * @property {PresentationSubmission} presentation_submission Descriptor for the vp_token, linked by presentation_definition. See also the Presentation Definition schema.
 * @property {EBSIScope} scope Possible values: [openid didr_write, openid didr_invite, openid tir_write, openid tir_invite, openid timestamp_write, openid tnt_authorise, openid tnt_create, openid tnt_write] OIDC scope
 */
export interface GetAccessTokenArgs {
  grant_type?: string
  vp_token: string
  presentation_submission: PresentationSubmission
  scope: EBSIScope
}

/**
 * @typedef GetAccessTokenSuccessResponse
 * @type {object}
 * @property {string} access_token ^(([A-Za-z0-9\-_])+\.)([A-Za-z0-9\-_]+)(\.([A-Za-z0-9\-_]+)?$ The access token issued by the authorization server in JWS format. See also the "Access Token" schema definition
 * @property {TokenType} token_type Possible values: [Bearer]/MUST be Bearer
 * @property {number} [expires_in] Possible values: >= 1. The lifetime in seconds of the access token
 * @property {EBSIScope} scope  Possible values: [openid didr_write, openid didr_invite, openid tir_invite, openid tir_write, openid timestamp_write, openid tnt_authorise, openid tnt_create, openid tnt_write] The scope of the access token
 * @property {string} id_token ^(([A-Za-z0-9\-_])+\.)([A-Za-z0-9\-_]+)(\.([A-Za-z0-9\-_]+)?$ ID Token value associated with the authenticated session. Presents client's identity. ID Token is issued in a JWS format. See also the "ID Token" schema definition.
 */
export interface GetAccessTokenSuccessResponse {
  access_token: string
  token_type: TokenType
  expires_in?: number
  scope: EBSIScope
  id_token: string
}

/**
 * Natural Person and Legal Entities entry point to initiate a SIOP DID Auth Request.
 * @typedef InitiateSIOPDidAuthRequestArgs
 * @type {object}
 * @property {EBSIScope} scope Scope is used to define the authentication response method.
 */
export interface InitiateSIOPDidAuthRequestArgs {
  scope: EBSIScope
}

/**
 * OpenId DID SIOP Uri response.
 * @typedef InitiateSIOPDidAuthRequestSuccessResponse
 * @type {object}
 * @property {string} [uri]
 */
export interface InitiateSIOPDidAuthRequestSuccessResponse {
  uri: string
}

/**
 * The request body must contain an ID Token (parameter name: id_token). The VP token is deprecated.
 *
 * The ID Token should be a JWT. Its header must contain the signer's kid (e.g. "kid": "did:ebsi:zbM8cCuoBMFNLeQyLiVFyxw#keys-1"). The ID Token payload must contain the following fields:
 *
 *     aud: the URL of the /siop-sessions endpoint, e.g. "https://api-pilot.ebsi.eu/authorisation/v2/siop-sessions"
 *     sub: the subject
 *     sub_jwk: the JWK used to sign the JWT
 *     nonce: a random UUID
 *     claims:
 *         encryption_key: public key used to encrypt the response
 *     responseMode: should be "form_post",
 *     iss: should be "https://self-issued.me/v2",
 *     _vp_token: only if the request also contains a VP token.
 *         presentation_submission: a VP submission object (https://identity.foundation/presentation-exchange/spec/v2.0.0/#presentation-submission).
 * @typedef CreateSIOPSessionArgs
 * @type {object}
 * @property {string} id_token JWS compact serialised ID Token
 * @property {string} [vp_token] A Verifiable Presentation JWT. Only for onboarding.
 */
export interface CreateSIOPSessionArgs {
  id_token: string
  vp_token?: string
}

/**
 * @typedef Ake1SigPayload
 * @type {object}
 * @property {string} [ake1_enc_payload] Encrypted payload with user's public key
 * @property {string} [ake1_nonce] Nonce used during the authentication process
 * @property {string} [did] API DID
 * @property {string} [kid] Trusted App KID
 * @property {number} [iat] Issued at
 * @property {number} [exp] Expires at
 * @property {string} [iss] Issuer (Authorisation API)
 */
export interface Ake1SigPayload {
  ake1_enc_payload?: string
  ake1_nonce?: string
  did?: string
  kid?: string
  iat?: number
  exp?: number
  iss?: string
}

/**
 * @typedef CreateSIOPSessionSuccessResponse
 * @type {object}
 * @property {string} [ake1_enc_payload] Encrypted payload with user's public key
 * @property {string} [ake1_jws_detached] Detached JWS of AKE1 Signing Payload
 * @property {Ake1SigPayload} [ake1_sig_payload]
 * @property {string} [kid] API KID
 */
export interface CreateSIOPSessionSuccessResponse {
  ake1_enc_payload?: string
  ake1_jws_detached?: string
  ake1_sig_payload?: Ake1SigPayload
  kid?: string
}

/**
 * @typedef CreateOAuth2SessionArgs
 * @type {object}
 * @property {string} grantType Grant type. Must be set to "client_credentials"
 * @property {string} clientAssertionType Client Assertion type. Must be set to "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
 * @property {string} clientAssertion Self-signed JWT
 * @property {EBSIScope} scope Scope is used to define the authentication method. Must be set to "openid did_authn"
 */
export interface CreateOAuth2SessionArgs {
  grantType: string
  clientAssertionType: string
  clientAssertion: string
  scope: EBSIScope
}

/**
 * @typedef CreateOAuth2SessionSuccessResponse
 * @type {object}
 * @property {string} [ake1_enc_payload] Encrypted payload with user's public key
 * @property {string} [ake1_jws_detached] Detached JWS of AKE1 Signing Payload
 * @property {Ake1SigPayload} [ake1_sig_payload]
 * @property {string} [kid] API KID
 */
export interface CreateOAuth2SessionSuccessResponse {
  ake1_enc_payload: string
  ake1_jws_detached: string
  ake1_sig_payload: Ake1SigPayload
  kid: string
}

/**
 * @typedef ExceptionResponse
 * @type {object}
 * @property {(URL | string)} [type] An absolute URI that identifies the problem type. When dereferenced, it SHOULD provide human-readable documentation for the problem type.
 * @property {string} [title] A short summary of the problem type.
 * @property {number} [status] Possible values: >= 400 and <= 600.  The HTTP status code generated by the origin server for this occurrence of the problem.
 * @property {string} [detail] A human readable explanation specific to this occurrence of the problem.
 * @property {(URL | string)} [instance] An absolute URI that identifies the specific occurrence of the problem. It may or may not yield further information if dereferenced.
 */
export interface ExceptionResponse {
  type?: URL | string
  title?: string
  status?: number
  detail?: string
  instance?: URL | string
}

export type GetOIDProviderMetadataResponse = GetOIDProviderMetadataSuccessResponse | ExceptionResponse
export type GetOIDProviderJwksResponse = GetOIDProviderJwksSuccessResponse | ExceptionResponse
export type GetPresentationDefinitionResponse = GetPresentationDefinitionSuccessResponse | ExceptionResponse
export type GetAccessTokenResponse = GetAccessTokenSuccessResponse | ExceptionResponse
export type InitiateSIOPDidAuthRequestResponse = InitiateSIOPDidAuthRequestSuccessResponse | ExceptionResponse
export type CreateSIOPSessionResponse = CreateSIOPSessionSuccessResponse | ExceptionResponse
export type CreateOAuth2SessionResponse = CreateOAuth2SessionSuccessResponse | ExceptionResponse
export type IRequiredContext = IAgentContext<IKeyManager & IDIDManager>
