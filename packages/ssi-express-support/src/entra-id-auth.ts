import passport from 'passport'
import { IBearerStrategyOption, IBearerStrategyOptionWithRequest, ITokenPayload, VerifyCallback } from './types'

export class EntraIDAuth {
  private readonly strategy: string
  private options?: IBearerStrategyOptionWithRequest

  public static init(strategy: string) {
    return new EntraIDAuth(strategy)
  }

  private constructor(strategy: string) {
    this.strategy = strategy
  }

  public withOptions(options: IBearerStrategyOption | IBearerStrategyOptionWithRequest): this {
    this.options = {
      ...options,
      passReqToCallback: 'passReqToCallback' in options ? options.passReqToCallback : false,
    }
    return this
  }

  connectPassport() {
    const _options = this.options
    if (!_options) {
      throw Error('No options supplied for EntraID')
    }
    import('passport-azure-ad')
      .then((entraID) =>
        passport.use(
          this.strategy,
          new entraID.BearerStrategy(_options, function (token: ITokenPayload, cb: VerifyCallback): void {
            if (token) {
              // console.log(`token: ${JSON.stringify(token, null, 2)}`)
              return cb(null, token)
            }
            return cb('bearer token not found or incorrect', null)
          }),
        ),
      )
      .catch((reason) => {
        console.log(reason)
        throw Error('Could not create bearer strategy. Did you include the "passport-azure-ad/bearer-strategy" dependency in package.json?')
      })
  }
}
