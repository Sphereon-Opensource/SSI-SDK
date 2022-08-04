import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, ManagedKeyInfo } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { keyUtils as secp256k1_keyUtils } from '@transmute/did-key-secp256k1'
import * as ION from '@decentralized-identity/ion-tools'
import Debug from 'debug'
import { ICreateIdentifierOpts, KeyType, VerificationRelationship } from './types/ion-provider-types'

const debug = Debug('sphereon:ion-did-provider')

type IContext = IAgentContext<IKeyManager>


interface IIonPublicKey {
}

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:ion` identifiers
 * @public
 */
export class IonDIDProvider extends AbstractIdentifierProvider {
  private defaultKms: string

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
  }


  async createIdentifier(
    { kms, options, alias }: { kms?: string; alias?: string; options?: ICreateIdentifierOpts },
    context: IAgentContext<IKeyManager>,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    //todo: We need to do something with the recovery and update keypairs from the ION create call in Veramo

    const keys: ManagedKeyInfo[] = []
    const ionPublicKeys: IIonPublicKey[] = []

    if (!options?.keyOpts || options.keyOpts.length == 0) {
      // No options or no key options, results in us creating a single authentication key only
      const controllerKey = await context.agent.keyManagerCreate({
        kms: kms || this.defaultKms,
        type: KeyType.Secp256k1,
      })
      keys.push(controllerKey)
      ionPublicKeys.push(this.createIonPublicKey(controllerKey, [VerificationRelationship.authentication]))
    } else {
      // Options present, so either create or import keys depending on the values
      for (const keyOpt of options.keyOpts) {
        const importableKey = keyOpt.key
        if (importableKey) {
          importableKey.kms = kms || this.defaultKms
          importableKey.kid = keyOpt.kid ? keyOpt.kid : importableKey.kid
          // It would be nice if we also could provide a kid/alias on key creation and not only for key import

          // Check is not at the top of the if branch because we potentially updated the kid in the previous line
          if (importableKey.type ! in Object.values(KeyType)) {
            return Promise.reject(`Key type ${importableKey.type} for key ${importableKey.kid} is not supported for ION`)
          }
        }

        const key = importableKey ? await context.agent.keyManagerImport(importableKey) : await context.agent.keyManagerCreate({
          kms: kms || this.defaultKms,
          type: KeyType.Secp256k1,
        })

        keys.push(key)
        ionPublicKeys.push(this.createIonPublicKey(key, keyOpt.purposes))
      }
    }

    const did = new ION.DID({
      content: {
        publicKeys: ionPublicKeys,
      },
    })

    await did.generateRequest(0).then((requestBody: any) =>
      new ION.AnchorRequest(requestBody).submit(),
    )
    /*const requestBody = await did.generateRequest(0)
    const request = new ION.AnchorRequest(requestBody)
    await request.submit()
*/
    const identifier: Omit<IIdentifier, 'provider'> = {
      did: await did.getURI(),
      controllerKeyId: keys[0].kid,
      keys: keys,
      services: [],
    }

    // TODO: Long version DID is not conformant to "initial value" definition.
    debug(`Created (short version): ${await did.getURI('short')}`)
    debug('Created', identifier.did)

    return identifier
  }

  async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  async addKey({
                 identifier,
                 key,
                 options,
               }: { identifier: IIdentifier; key: IKey; options?: any }, context: IContext): Promise<any> {
    const did = this.ionDid(identifier)

    let updateOperation = await did.generateOperation('update', {
      // removePublicKeys: ["key-1"],
      addPublicKeys: [
        {
          id: key.kid,
          type: 'EcdsaSecp256k1VerificationKey2019',
          publicKeyJwk: secp256k1_keyUtils.publicKeyJwkFromPublicKeyHex(key.publicKeyHex),
          purposes: ['authentication'],
        },
      ],
      /*removeServices: ["some-service-1"],
      addServices: [{
        "id": "some-service-2",
        "type": "SomeServiceType",
        "serviceEndpoint": "http://www.example.com"
      }]*/
    })

    await did.generateRequest(updateOperation).then((requestBody: any) =>
      new ION.AnchorRequest(requestBody).submit(),
    )

  }

  async addService({
                     identifier,
                     service,
                     options,
                   }: { identifier: IIdentifier; service: IService; options?: any }, context: IContext): Promise<any> {
    throw new Error('Not Implemented')
  }

  async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
    throw new Error('Not Implemented')
  }

  async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
    throw new Error('Not Implemented')
  }

  private createIonPublicKey(key: ManagedKeyInfo, purposes: VerificationRelationship[]): IIonPublicKey {
    const publicJwk = secp256k1_keyUtils.publicKeyJwkFromPublicKeyHex(key.publicKeyHex)

    const id = key.kid.substring(0, 50) // ION restricts the id to 50 chars. Ideally we can also provide kids for key creation in Veramo
    if (id.length != key.kid.length) {
      debug(`Key kid ${key.kid} has been truncated to 50 chars to support ION!`)
    }

    return {
      id,
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyJwk: publicJwk,
      purposes,
    }
  }

  private ionDid(identifier: IIdentifier) {
    // fixme purpose is fixed. We either need to get it from metadata or resolve the current DID doc
    const publicKeys = identifier.keys.flatMap((key) => this.createIonPublicKey(key, [VerificationRelationship.authentication]))

    return new ION.DID({
      content: {
        publicKeys,
      },
    })
  }

}
