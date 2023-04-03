import {
  IPEXDefinitionPersistArgs,
  IPEXInstanceOptions,
  IRequiredContext,
  IRPOptions, ISiopRPInstanceArgs,
  ISiopv2RPOpts,
  schema, VersionDiscoveryResult,
} from '../index'
import { IAgentPlugin } from '@veramo/core'

import { ISiopv2RelyingParty } from '../types/ISiopv2RelyingParty'
import { IKeyValueStore, IValueData, KeyValueStore } from '@veramo/kv-store'
import { IPresentationDefinition, PEX } from '@sphereon/pex'
import { RPInstance } from '../RPInstance'

export class Siopv2RelyingParty implements IAgentPlugin {
  private static PEX = new PEX()
  private readonly _definitionStore: IKeyValueStore<IPresentationDefinition>
  private readonly opts: ISiopv2RPOpts
  private readonly _optionsStore: IKeyValueStore<IRPOptions>
  private static readonly _DEFAULT_OPTS_KEY = '_default'
  readonly schema = schema.IDidAuthSiopOpAuthenticator

  readonly methods: ISiopv2RelyingParty = {
    pexDefinitionGet: this.pexDefinitionGet.bind(this),
    pexDefinitionPersist: this.pexDefinitionPersist.bind(this),
    pexDefinitionExists: this.pexDefinitionExists.bind(this),
    pexDefinitionVersion: this.pexDefinitionVersion.bind(this),
    siopRPInstance: this.siopRPInstance.bind(this),
  }

  constructor(
    opts: ISiopv2RPOpts,
  ) {
    this.opts = opts
    this._optionsStore = opts.optionsStore ?? new KeyValueStore({
      namespace: 'siop-rp-opts',
      store: new Map<string, IRPOptions>,
    })
    this.opts.optionsStore = this._optionsStore
    this._definitionStore = opts.definitionStore ?? new KeyValueStore({
      namespace: 'siop-rp-defs',
      store: new Map<string, IPresentationDefinition>(),
    })
    this.opts.definitionStore = this._definitionStore
    if (opts.defaultOpts) {
      this.optionsStore.set(Siopv2RelyingParty._DEFAULT_OPTS_KEY, opts.defaultOpts)
    }
    if (Array.isArray(opts.instanceOpts)) {
      for (const instance of opts.instanceOpts) {
        const instanceOpts = JSON.parse(JSON.stringify(instance)) as IPEXInstanceOptions
        const definition = instanceOpts.definition
        if (definition) {
          this.definitionStore.set(instanceOpts.definitionId, definition)
          delete instanceOpts.definition
        }
        if (instanceOpts.rpOpts) {
          this.optionsStore.set(instanceOpts.definitionId, instanceOpts.rpOpts)
        }
      }
    }
  }


  private async pexDefinitionGet(definitionId: string): Promise<IPresentationDefinition | undefined> {
    return this.definitionStore.get(definitionId)
  }


  private async pexDefinitionExists(definitionId: string): Promise<boolean> {
    return this.definitionStore.has(definitionId)
  }

  private async pexDefinitionPersist(args: IPEXDefinitionPersistArgs): Promise<IValueData<IPresentationDefinition>> {
    const { definition, definitionId, ttl } = args
    Siopv2RelyingParty.PEX.validateDefinition(definition) // throws an error in case the def is not valid
    return await this.definitionStore.set(definitionId || definition.id, definition, ttl).then(valueData => {
        if (args.rpOpts) {
          this.optionsStore.set(definitionId, args.rpOpts)
        }
        return valueData
      },
    )
  }

  async siopRPOptionsGet(definitionId?: string): Promise<IRPOptions> {
    const options = await this.optionsStore.get(definitionId ?? Siopv2RelyingParty._DEFAULT_OPTS_KEY) ?? await this.optionsStore.get(Siopv2RelyingParty._DEFAULT_OPTS_KEY)
    if (!options) {
      throw Error(`Could not get specific nor default options for definition ${definitionId}`)
    }
    return options
  }

  async siopRPInstance(args: ISiopRPInstanceArgs, context: IRequiredContext): Promise<RPInstance> {
    const { definitionId } = args
    const rpOpts = await this.siopRPOptionsGet(definitionId ?? Siopv2RelyingParty._DEFAULT_OPTS_KEY)
    const definition = definitionId ? await this.pexDefinitionGet(definitionId) : undefined
    return new RPInstance({ rpOpts, ...(definitionId ? { pexOpts: { definitionId, definition } } : {}) }, context)
  }

  async pexDefinitionVersion(presentationDefinition: IPresentationDefinition): Promise<VersionDiscoveryResult> {
    return Siopv2RelyingParty.PEX.definitionVersionDiscovery(presentationDefinition)
  }


  private get definitionStore(): IKeyValueStore<IPresentationDefinition> {
    return this._definitionStore
  }

  private get optionsStore(): IKeyValueStore<IRPOptions> {
    return this._optionsStore
  }


  public getDefinitionRP(definitionId: string) {

  }

}
