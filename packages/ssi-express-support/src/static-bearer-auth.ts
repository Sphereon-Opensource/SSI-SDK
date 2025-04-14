import passport from 'passport'
import * as u8a from 'uint8arrays'
import { BearerUser, IStaticBearerVerifyOptions } from './types'
export class StaticBearerAuth {
  private readonly strategy: string
  private static providers: Map<string, StaticBearerUserProvider> = new Map()
  private static verifyOptions: Map<string, IStaticBearerVerifyOptions | string> = new Map()
  private hashTokens?: boolean = false

  public static init(strategy: string, provider?: StaticBearerUserProvider) {
    return new StaticBearerAuth(strategy ?? 'bearer', provider ?? new MapBasedStaticBearerUserProvider(strategy))
  }

  private constructor(strategy: string, provider: StaticBearerUserProvider) {
    this.strategy = strategy
    if (StaticBearerAuth.providers.has(strategy)) {
      if (StaticBearerAuth.providers.get(strategy) !== provider) {
        throw Error('Cannot register another user provider for strategy: ' + strategy)
      }
    } else {
      StaticBearerAuth.providers.set(strategy, provider)
    }
  }

  get provider() {
    const provider = StaticBearerAuth.providers.get(this.strategy)
    if (!provider) {
      throw Error('Could not get user provider for ' + this.strategy)
    }
    return provider
  }

  withHashTokens(hashTokens: boolean): this {
    this.hashTokens = hashTokens
    return this
  }

  withUsers(users: BearerUser[] | BearerUser): this {
    this.addUser(users)
    return this
  }

  addUser(user: BearerUser[] | BearerUser): this {
    this.provider.addUser(user)
    return this
  }

  withVerifyOptions(options: IStaticBearerVerifyOptions | string): this {
    StaticBearerAuth.verifyOptions.set(this.strategy, options)
    return this
  }

  connectPassport() {
    const _provider = this.provider
    function findUser(token: string, cb: (error: any, user: any, options?: IStaticBearerVerifyOptions | string) => void) {
      const user = _provider.getUser(token)
      if (user) {
        return cb(null, user)
      }
      return cb('bearer token not found or incorrect', false)
    }

    import('passport-http-bearer')
      .then((httpBearer) => {
        const hashTokens = this.hashTokens ?? false
        passport.use(
          this.strategy,
          new httpBearer.Strategy({ passReqToCallback: false }, function (
            token: string,
            cb: (error: any, user: any, options?: IStaticBearerVerifyOptions | string) => void,
          ): void {
            if (hashTokens) {
              import('@noble/hashes/sha256')
                .then((hash) => {
                  findUser(u8a.toString(hash.sha256(token)), cb)
                })
                .catch((error) => {
                  console.log(`hash problem: ${error}`)
                  throw Error('Did you include @noble/hashes in package.json?')
                })
            } else {
              findUser(token, cb)
            }
          }),
        )
      })
      .catch((error) => {
        console.log(`passport-http-bearer package problem: ${error}`)
        throw Error('Did you include passport-http-bearer in package.json?')
      })
  }
}

export interface StaticBearerUserProvider {
  strategy: string

  addUser(user: BearerUser | BearerUser[], hashToken?: boolean): void

  getUser(token: string): BearerUser | undefined

  hashedTokens?: boolean
}

export class MapBasedStaticBearerUserProvider implements StaticBearerUserProvider {
  private readonly _strategy: string
  private readonly _users: BearerUser[] = []
  private readonly _hashedTokens: boolean

  constructor(strategy: string, hashedTokens?: boolean) {
    this._strategy = strategy
    this._hashedTokens = hashedTokens ?? false
  }

  get users(): BearerUser[] {
    return this._users
  }

  get hashedTokens(): boolean {
    return this._hashedTokens
  }

  get strategy(): string {
    return this._strategy
  }

  getUser(token: string): BearerUser | undefined {
    return this.users.find((user) => user.token === token)
  }

  addUser(user: BearerUser | BearerUser[], hashToken?: boolean): void {
    const users = Array.isArray(user) ? user : [user]
    if (hashToken) {
      if (!this.hashedTokens) {
        throw Error('Cannot hash token, when hashed tokens is not enabled on the user provider for strategy ' + this.strategy)
      }
      import('@noble/hashes/sha256')
        .then((hash) => {
          users.forEach((user) => (user.token = u8a.toString(hash.sha256(user.token))))
        })
        .catch((error) => {
          console.log(`hash problem: ${error}`)
          throw Error('Did you include @noble/hashes in package.json?')
        })
    }
    this._users.push(...users)
  }

  getUsers(): BearerUser[] {
    return this._users
  }
}
