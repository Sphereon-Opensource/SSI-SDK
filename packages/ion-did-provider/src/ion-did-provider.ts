import {
  IAgentContext,
  IIdentifier,
  IKey,
  IKeyManager,
  IService,
  ManagedKeyInfo,
  MinimalImportableKey,
} from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { keyUtils as secp256k1_keyUtils } from '@transmute/did-key-secp256k1'
import * as ION from '@decentralized-identity/ion-tools'
import Debug from 'debug'
import {
  ICreateIdentifierOpts,
  IIonKeyPair,
  IIonPublicKey,
  IKeyOpts,
  KeyType,
  VerificationRelationship,
} from './types/ion-provider-types'

import { generateKeyPair as generateSigningKeyPair } from '@stablelib/ed25519'

import * as u8a from 'uint8arrays'
import { randomBytes } from '@ethersproject/random'

const debug = Debug('sphereon:ion-did-provider')

type IContext = IAgentContext<IKeyManager>




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


    // No options or no key options, results in us creating a single authentication key only
    const keyOpts = options?.keyOpts ? options?.keyOpts : [{
      type: KeyType.Secp256k1,
      purposes: [VerificationRelationship.authentication],
    }]

    const keys: ManagedKeyInfo[] = []
    const ionPublicKeys: IIonPublicKey[] = []
    const ionKeyPairs: IIonKeyPair[] = []
    for (const keyOpt of keyOpts) {
      const key = await this.importKeyPair({ kms, options: keyOpt }, context)
      keys.push(key)
      ionPublicKeys.push(this.createIonPublicKey(key, keyOpt.purposes))
      ionKeyPairs.push(this.toIonKeyPair(key))
    }

    //todo: We need to do something with the recovery and update keypairs from the ION create call in Veramo and split content keys from them as well
    const did = new ION.DID({
      ops: [
        {
          operation: 'create',
          content: {
            publicKeys: ionPublicKeys.length == 1 ? [ionPublicKeys[0]] : ionPublicKeys.slice(1)
          },
          recovery: ionKeyPairs[0],
          update: ionKeyPairs[0],
        },
      ],
    })

    /*const did = new ION.DID({
      content: {
        publicKeys: ionPublicKeys,
      },
    })
*/
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
    const publicKeyJwk = secp256k1_keyUtils.publicKeyJwkFromPublicKeyHex(key.publicKeyHex)

    const id = key.kid.substring(0, 50) // ION restricts the id to 50 chars. Ideally we can also provide kids for key creation in Veramo
    if (id.length != key.kid.length) {
      debug(`Key kid ${key.kid} has been truncated to 50 chars to support ION!`)
    }

    return {
      id,
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyJwk,
      purposes,
    }
  }


  private toIonKeyPair(key: MinimalImportableKey | IKey) : IIonKeyPair {
    const privateJwk = secp256k1_keyUtils.privateKeyJwkFromPrivateKeyHex(key.privateKeyHex!)
    const publicJwk = secp256k1_keyUtils.publicKeyJwkFromPublicKeyHex(key.publicKeyHex!)
    delete  privateJwk.kid
    delete  publicJwk.kid
    return {
      privateJwk,
      publicJwk
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


  /**
   * We generate and import our own keys. First we want to be able to asign Key IDs, which Veramo doesn;t support on creation. Next we need the private key for ION
   * @param type
   * @param kms
   * @param options
   * @param alias
   * @param context
   * @private
   */
  private async importKeyPair({
                                kms,
                                options,
                              }: { kms?: string; options?: IKeyOpts }, context: IAgentContext<IKeyManager>): Promise<IKey> {
    const kid = options?.kid ? options?.kid : options?.key?.kid
    const type = options?.type ? options.type : KeyType.Secp256k1
    const privateKeyHex = options?.key ? options.key.privateKeyHex : this.generatePrivateKeyHex(type)
    const key: IKey = await context.agent.keyManagerImport({
      kms: kms || this.defaultKms,
      type,
      privateKeyHex,
      kid,
    })
    key.privateKeyHex = privateKeyHex

    debug('Created key', type, kid, key.publicKeyHex)

    return key
  }

  private generatePrivateKeyHex(type: KeyType) {
    let privateKeyHex: string

    switch (type) {
      case KeyType.Ed25519: {
        const keyPairEd25519 = generateSigningKeyPair()
        privateKeyHex = u8a.toString(keyPairEd25519.secretKey, 'base16')
        break
      }
      case KeyType.Secp256k1: {
        const privateBytes = randomBytes(32)
        privateKeyHex = u8a.toString(privateBytes, 'base16')
        break
      }
      default:
        throw Error('not_supported: Key type not supported: ' + type)
    }
    return privateKeyHex
  }
}
