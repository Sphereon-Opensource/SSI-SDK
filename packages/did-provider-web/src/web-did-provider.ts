import { asDidWeb } from '@sphereon/ssi-sdk-ext.did-utils'
import { importProvidedOrGeneratedKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'

import Debug from 'debug'
import { ICreateIdentifierArgs, IKeyOpts } from './types'

const debug = Debug('sphereon:web-did:identifier-provider')

type IContext = IAgentContext<IKeyManager>

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:web` identifiers
 * @public
 */
export class WebDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
  }

  async createIdentifier(args: ICreateIdentifierArgs, context: IContext): Promise<Omit<IIdentifier, 'provider'>> {
    const { kms, alias } = args
    const opts = args.options ?? {}
    if (!opts.keys || (Array.isArray(opts.keys) && opts.keys.length === 0)) {
      // Let's generate a key as no import keys or types are provided
      opts.keys = [{ type: 'Secp256r1', isController: true }]
    }
    const keyOpts = Array.isArray(opts.keys) ? opts.keys : [opts.keys as IKeyOpts]
    const keys = await Promise.all(
      keyOpts.map((keyOpt: IKeyOpts) => importProvidedOrGeneratedKey({ kms: kms ?? this.defaultKms, options: keyOpt }, context))
    )

    const controllerIdx = keyOpts.findIndex((opt) => opt.isController)
    const controllerKeyId = controllerIdx < 0 ? keys[0].kid : keys[controllerIdx].kid
    const identifier: Omit<IIdentifier, 'provider'> = {
      did: await asDidWeb(alias),
      controllerKeyId,
      keys,
      services: opts.services ?? [],
    }
    debug('Created', identifier)
    return identifier
  }

  async updateIdentifier(
    args: {
      did: string
      kms?: string | undefined
      alias?: string | undefined
      options?: any
    },
    context: IAgentContext<IKeyManager>
  ): Promise<IIdentifier> {
    throw new Error('WebDIDProvider updateIdentifier not supported yet.')
  }

  async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  async addKey(
    {
      identifier,
      key,
      options,
    }: {
      identifier: IIdentifier
      key: IKey
      options?: any
    },
    context: IContext
  ): Promise<any> {
    return { success: true }
  }

  async addService(
    {
      identifier,
      service,
      options,
    }: {
      identifier: IIdentifier
      service: IService
      options?: any
    },
    context: IContext
  ): Promise<any> {
    return { success: true }
  }

  async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }

  async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
    return { success: true }
  }
}
