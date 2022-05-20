import { KeyDIDProvider } from '@veramo/did-provider-key'
import { IAgentContext, IKeyManager, IIdentifier } from '@veramo/core'
import Multibase from 'multibase'
import Multicodec from 'multicodec'
import Debug from 'debug'

const debug = Debug('bls-did-provider-key')

type IContext = IAgentContext<IKeyManager>

export class BlsKeyDidProvider extends KeyDIDProvider {
  private kms: string

  constructor(options: { defaultKms: string }) {
    super(options)
    this.kms = options.defaultKms
  }

  async createIdentifier({ kms, options }: { kms?: string; options?: any }, context: IContext): Promise<Omit<IIdentifier, 'provider'>> {
    if (options.type === 'Bls12381G2') {
      const key = await context.agent.keyManagerCreate({ kms: kms || this.kms, type: 'Bls12381G2' })

      const methodSpecificId = Buffer.from(
        Multibase.encode('base58btc', Multicodec.addPrefix('bls12_381-g2-pub', Buffer.from(key.publicKeyHex, 'hex')))
      ).toString()

      const identifier: Omit<IIdentifier, 'provider'> = {
        did: 'did:key:' + methodSpecificId,
        controllerKeyId: key.kid,
        keys: [key],
        services: [],
      }
      debug('Created', identifier.did)
      return identifier
    }
    return super.createIdentifier({ kms, options }, context)
  }
}
