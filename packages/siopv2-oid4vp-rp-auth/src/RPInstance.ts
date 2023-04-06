import { RP } from '@sphereon/did-auth-siop'
import { IPEXOptions, IRequiredContext, IRPOptions } from './types/ISiopv2RelyingParty'
import { IPresentationDefinition } from '@sphereon/pex'
import { createRPBuilder } from './functions'

export class RPInstance {
  private readonly context: IRequiredContext
  private _rp: RP | undefined
  private readonly _pexOptions: IPEXOptions | undefined
  private readonly _rpOptions: IRPOptions

  public constructor({ rpOpts, pexOpts }: {
    rpOpts: IRPOptions,
    pexOpts?: IPEXOptions
  }, context: IRequiredContext) {
    this._rpOptions = rpOpts
    this._pexOptions = pexOpts
    this.context = context
  }


  public async get(): Promise<RP> {
    if (!this._rp) {
      const builder = await createRPBuilder({ rpOpts: this._rpOptions, pexOpts: this._pexOptions, context: this.context })
      this._rp = builder.build()
    }
    return this._rp!
  }


  get rpOptions() {
    return this._rpOptions
  }


  get pexOptions() {
    return this._pexOptions
  }

  get definitionId(): string | undefined {
    return this.pexOptions?.definitionId
  }

  public getPresentationDefinition(): IPresentationDefinition | undefined {
    return this.pexOptions?.definition
  }

}

