import passport from 'passport'

export type OIDCAlgorithm = 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'PS256' | 'PS384' | 'PS512'

export interface IOIDCBearerOptions {
  issuer: string
  audience?: string | string[]
  jwksUri?: string
  algorithms?: OIDCAlgorithm[]
}

export interface IOIDCTokenPayload {
  /** Issuer identifier */
  iss?: string
  /** Subject identifier */
  sub?: string
  /** Audience(s) */
  aud?: string | string[]
  /** Expiration time */
  exp?: number
  /** Not before */
  nbf?: number
  /** Issued at */
  iat?: number
  /** JWT ID */
  jti?: string
  /** Authorized party */
  azp?: string
  /** Scope */
  scope?: string
  /** Client ID */
  client_id?: string
  /** Additional claims */
  [key: string]: unknown
}

export class OIDCBearerAuth {
  private readonly strategy: string
  private options: Partial<IOIDCBearerOptions> = {}

  public static init(strategy: string) {
    return new OIDCBearerAuth(strategy)
  }

  private constructor(strategy: string) {
    this.strategy = strategy
  }

  public withIssuer(issuer: string): this {
    this.options = { ...this.options, issuer }
    return this
  }

  public withAudience(audience: string | string[]): this {
    this.options = { ...this.options, audience }
    return this
  }

  public withJwksUri(jwksUri: string): this {
    this.options = { ...this.options, jwksUri }
    return this
  }

  public withAlgorithms(algorithms: OIDCAlgorithm[]): this {
    this.options = { ...this.options, algorithms }
    return this
  }

  public withOptions(options: Partial<IOIDCBearerOptions>): this {
    this.options = { ...this.options, ...options }
    return this
  }

  async connectPassport(): Promise<void> {
    const { issuer, audience, algorithms } = this.options

    if (!issuer) {
      return Promise.reject(new Error('No issuer supplied for OIDC Bearer Auth'))
    }

    let jwksUri = this.options.jwksUri
    if (!jwksUri) {
      jwksUri = await this.discoverJwksUri(issuer)
    }

    try {
      const [passportJwt, jwksRsa] = await Promise.all([import('passport-jwt'), import('jwks-rsa')])

      const { Strategy: JwtStrategy, ExtractJwt } = passportJwt
      const { passportJwtSecret } = jwksRsa

      const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKeyProvider: passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri,
        }),
        issuer,
        audience,
        algorithms: algorithms ?? (['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'] as OIDCAlgorithm[]),
      }

      passport.use(
        this.strategy,
        new JwtStrategy(jwtOptions, (payload: IOIDCTokenPayload, done: (error: any, user?: any, info?: any) => void) => {
          if (payload) {
            return done(null, payload)
          }
          return done('Bearer token not found or incorrect', null)
        })
      )
    } catch (error) {
      console.error('Failed to initialize OIDC Bearer Auth:', error)
      return Promise.reject(
        new Error(
          'Could not create JWT bearer strategy. Did you include "passport-jwt" and "jwks-rsa" dependencies in package.json?',
          { cause: error }
        )
      )
    }
  }

  private async discoverJwksUri(issuer: string): Promise<string> {
    const wellKnownUrl = `${issuer}${issuer.endsWith('/') ? '' : '/'}.well-known/openid-configuration`

    try {
      const response = await fetch(wellKnownUrl)
      if (!response.ok) {
        return Promise.reject(
          new Error(`Failed to fetch OIDC configuration from ${wellKnownUrl}: ${response.status} ${response.statusText}`)
        )
      }

      const config = (await response.json()) as { jwks_uri?: string }
      if (!config.jwks_uri) {
        return Promise.reject(new Error(`OIDC configuration at ${wellKnownUrl} does not contain jwks_uri`))
      }

      return config.jwks_uri
    } catch (error) {
      return Promise.reject(
        new Error(`Failed to discover JWKS URI from OIDC configuration at ${wellKnownUrl}`, { cause: error })
      )
    }
  }
}
