import { Enforcer } from 'casbin'
import { Express, RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import http from 'http'
import { HttpTerminator } from 'http-terminator'
import { AuthenticateCallback, Strategy } from 'passport'
import { ParsedQs } from 'qs'

export interface IExpressServerOpts {
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
  basePath?: string
  existingExpress?: Express
  listenCallback?: () => void
  startListening?: boolean
  // externalBaseUrl?: string // In case an external base URL needs to be exposed
}

export function hasEndpointOpts(opts: any) {
  return 'endpointOpts' in opts && opts.endpointOpts
}

export type HasEndpointOpts = { endpointOpts?: IEndpointOpts & SingleEndpoints } & Record<string, any>

export type SingleEndpoints = Record<string, ISingleEndpointOpts | any>
export interface IEndpointOpts {
  basePath?: string // The base path used to construct the router
  baseUrl?: string | URL // Typically the external base URL
  globalAuth?: GenericAuthArgs
}
export interface ExpressSupport {
  express: Express
  port: number
  hostname: string
  userIsInRole?: string | string[]
  startListening: boolean
  server?: http.Server
  enforcer?: Enforcer
  start: (opts?: { disableErrorHandler?: boolean; doNotStartListening?: boolean }) => { server: http.Server; terminator: HttpTerminator }
  stop: (terminator?: HttpTerminator) => Promise<boolean>
}

export interface ISingleEndpointOpts extends GenericAuthArgs {
  endpoint?: EndpointArgs
  enabled?: boolean
  path?: string
  disableGlobalAuth?: boolean
}

export interface GenericAuthArgs {
  authentication?: {
    callback?: AuthenticateCallback | ((...args: any[]) => any)
    useDefaultCallback?: boolean
    enabled?: boolean
    strategy?: string | string[] | Strategy
    strategyOptions?: Record<string, any> | any
    authInfo?: boolean
    session?: boolean
  }
  authorization?: {
    enabled?: boolean
    requireUserInRoles?: string | string[]
    enforcer?: Enforcer
  }
}

export interface EndpointArgs extends GenericAuthArgs {
  resource?: string
  operation?: string
  handlers?: RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>[]
}

export interface BearerUser extends Express.User {
  id: string | number
  name?: string
  token: string
}

export interface IStaticBearerVerifyOptions {
  message?: string | undefined
  scope: string | Array<string>
}

export interface IBaseStrategyOption {
  identityMetadata: string
  clientID: string
  isB2C?: boolean | undefined
  validateIssuer?: boolean | undefined
  issuer?: string | string[] | undefined
  loggingLevel?: 'info' | 'warn' | 'error' | undefined
  loggingNoPII?: boolean | undefined
  clockSkew?: number | undefined
}

export interface ITokenPayload {
  /** An App ID URI. Identifies the intended recipient of the token. */
  aud?: string | undefined
  /** A security token service(STS) URI. Identifies the STS that constructs and returns the token,
   * and the Azure AD tenant in which the user was authenticated.*/
  iss?: string | undefined
  /** The identity provider that authenticated the subject of the token*/
  idp?: string | undefined
  /** "Issued At" indicates when the authentication for this token occurred. */
  iat?: number | undefined
  /** The "nbf" (not before) claim identifies the time before which the JWT must not be accepted for processing. */
  nbf?: number | undefined
  /** The "exp" (expiration time) claim identifies the expiration time on or after which the JWT must not be accepted for processing. */
  exp?: number | undefined
  /** An internal claim used by Azure AD to record data for token reuse. */
  aio?: string | undefined
  /** Only present in v1.0 tokens. The "Authentication context class" claim. A value of "0" indicates the end-user authentication did not meet the requirements of ISO/IEC 29115. */
  acr?: '0' | '1' | undefined
  /** Only present in v1.0 tokens. Identifies how the subject of the token was authenticated.  */
  amr?: string[] | undefined
  /** Only present in v1.0 tokens. GUID represents the application ID of the client using the token. */
  appid?: string | undefined
  /** Only present in v2.0 tokens. The application ID of the client using the token. */
  azp?: string | undefined
  /** Only present in v1.0 tokens. Indicates how the client was authenticated. For a public client, the value is "0".
   * If client ID and client secret are used, the value is "1". If a client certificate was used for authentication, the value is "2". */
  appidacr?: '0' | '1' | '2' | undefined
  /** Only present in v2.0 tokens. Indicates how the client was authenticated.
   * For a public client, the value is "0". If client ID and client secret are used, the value is "1". If a client certificate was used for authentication, the value is "2". */
  azpacr?: '0' | '1' | '2' | undefined
  /** Only present in v2.0 tokens. The primary username that represents the user. It could be an email address, phone number, or a generic username without a specified format */
  preferred_username?: string | undefined
  /** Provides a human-readable value that identifies the subject of the token.
   * The value is not guaranteed to be unique, it is mutable, and it's designed to be used only for display purposes. The profile scope is required in order to receive this claim. */
  name?: string | undefined
  /** The set of scopes exposed by your application for which the client application has requested (and received) consent. */
  scp?: string | undefined
  /** The set of permissions exposed by your application that the requesting application has been given permission to call. */
  roles?: string[] | undefined
  /** Provides object IDs that represent the subject's group memberships. */
  groups?: string | string[] | undefined
  /** Denoting the user is in at least one group. */
  hasgroups?: true | undefined
  /** The principal about which the token asserts information, such as the user of an app. This value is immutable and cannot be reassigned or reused.
   * It can be used to perform authorization checks safely, such as when the token is used to access a resource,
   * and can be used as a key in database tables. Because the subject is always present in the tokens that Azure AD issues,
   * we recommend using this value in a general-purpose authorization system. The subject is, however, a pairwise identifier - it is unique to a particular application ID.   */
  sub?: string | undefined
  /** GUID represents a user. This ID uniquely identifies the user across applications. */
  oid?: string | undefined
  /** Represents the Azure AD tenant that the user is from. */
  tid?: string | undefined
  /** Only present in v1.0 tokens. Provides a human readable value that identifies the subject of the token.  */
  unique_name?: string | undefined
  /** An internal claim used by Azure to revalidate tokens. */
  uti?: string | undefined
  /** An internal claim used by Azure to revalidate tokens. */
  rh?: string | undefined
  /** Indicates the version of the access token. */
  ver?: '1.0' | '2.0' | undefined

  /** v1.0 basic claims */

  /** The IP address the user authenticated from. */
  ipaddr?: string | undefined
  /** In cases where the user has an on-premises authentication, this claim provides their SID. */
  onprem_sid?: string | undefined
  /** Indicates when the user's password expires. */
  pwd_exp?: number | undefined
  /** A URL where users can be sent to reset their password. */
  pwd_url?: string | undefined
  /** Signals if the client is logging in from the corporate network. If they aren't, the claim isn't included. */
  in_corp?: string | undefined
  /** An additional name for the user, separate from first or last name */
  nickname?: string | undefined
  /** Provides the last name, surname, or family name of the user as defined on the user object. */
  family_name?: string | undefined
  /** Provides the first or given name of the user, as set on the user object. */
  given_name?: string | undefined
  /** The username of the user. May be a phone number, email address, or unformatted string. */
  upn?: string | undefined
}
export interface IBaseStrategyOption {
  identityMetadata: string
  clientID: string
  isB2C?: boolean | undefined
  validateIssuer?: boolean | undefined
  issuer?: string | string[] | undefined
  loggingLevel?: 'info' | 'warn' | 'error' | undefined
  loggingNoPII?: boolean | undefined
  clockSkew?: number | undefined
}

export interface IBearerStrategyOption extends IBaseStrategyOption {
  audience?: string | string[] | undefined
  policyName?: String | undefined
  allowMultiAudiencesInToken?: boolean | undefined
  scope?: string[] | undefined
}

export interface IBearerStrategyOptionWithRequest extends IBearerStrategyOption {
  passReqToCallback: boolean
}
export type VerifyBearerFunction = (token: ITokenPayload, done: VerifyCallback) => void
export interface VerifyCallback {
  (error: any, user?: any, info?: any): void
}
