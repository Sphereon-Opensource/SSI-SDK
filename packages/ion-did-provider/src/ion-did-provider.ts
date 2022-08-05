import { IAgentContext, IIdentifier, IKey, IKeyManager, IService, ManagedKeyInfo, MinimalImportableKey } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import { keyUtils as secp256k1_keyUtils } from '@transmute/did-key-secp256k1'
import * as ION from '@decentralized-identity/ion-tools'
import Debug from 'debug'
import {
  ICreateIdentifierOpts,
  IIonKeyPair,
  IIonPublicKey,
  KeyIdentifierRelation,
  KeyOpts,
  KeyType,
  VerificationMethod,
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
  private readonly defaultKms: string

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
  }

  async createIdentifier(
    { kms, options, alias }: { kms?: string; alias?: string; options?: ICreateIdentifierOpts },
    context: IAgentContext<IKeyManager>
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const recoveryKey = await this.importKey(
      {
        kms,
        relation: KeyIdentifierRelation.RECOVERY,
        options: options?.recoveryKey,
      },
      context
    )
    const updateKey = await this.importKey(
      {
        kms,
        relation: KeyIdentifierRelation.UPDATE,
        options: options?.updateKey,
      },
      context
    )

    // No options or no key options, results in generating a single key as the only authentication verification method in the DID
    const verificationMethods = options?.verificationMethods
      ? options.verificationMethods
      : [
          {
            type: KeyType.Secp256k1,
            purposes: [VerificationRelationship.authentication],
          },
        ]

    const keys: ManagedKeyInfo[] = [recoveryKey, updateKey]
    const ionPublicKeys: IIonPublicKey[] = []
    const ionKeyPairs: IIonKeyPair[] = []
    for (const verificationMethod of verificationMethods) {
      const key = await this.importKey(
        {
          kms,
          relation: KeyIdentifierRelation.DID,
          options: verificationMethod,
        },
        context
      )
      keys.push(key)
      ionPublicKeys.push(this.createIonPublicKey(key, verificationMethod.purposes))
      ionKeyPairs.push(this.toIonKeyPair(key))
    }

    const services = options?.services ? options.services : []
    const did = new ION.DID({
      ops: [
        {
          operation: 'create',
          content: {
            publicKeys: ionPublicKeys,
            services,
          },
          recovery: recoveryKey as MinimalImportableKey,
          update: updateKey as MinimalImportableKey,
        },
      ],
    })

    await did
      .generateRequest(0)
      // .filter(options?.anchor == undefined || options.anchor)
      .then((requestBody: any) => new ION.AnchorRequest(requestBody).submit())

    const identifier: Omit<IIdentifier, 'provider'> = {
      did: await did.getURI(),
      controllerKeyId: updateKey.kid,
      keys,
      services,
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

  async addKey({ identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: any }, context: IContext): Promise<any> {
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

    await did.generateRequest(updateOperation).then((requestBody: any) => new ION.AnchorRequest(requestBody).submit())
  }

  async addService({ identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any }, context: IContext): Promise<any> {
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

  private toIonKeyPair(key: MinimalImportableKey | IKey): IIonKeyPair {
    const privateJwk = secp256k1_keyUtils.privateKeyJwkFromPrivateKeyHex(key.privateKeyHex!)
    const publicJwk = secp256k1_keyUtils.publicKeyJwkFromPublicKeyHex(key.publicKeyHex!)
    delete privateJwk.kid
    delete publicJwk.kid
    return {
      privateJwk,
      publicJwk,
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
   * We optionally generate and then import our own keys.
   *
   * Reason for this is that we want to be able to assign Key IDs (kid), which Veramo doesn't support on creation. Next we need the private key for ION
   * @param type
   * @param kms
   * @param options
   * @param alias
   * @param context
   * @private
   */
  private async importKey(
    { kms, relation, options }: { kms?: string; relation: KeyIdentifierRelation; options?: KeyOpts | VerificationMethod },
    context: IAgentContext<IKeyManager>
  ): Promise<IKey> {
    const kid = options?.kid ? options.kid : options?.key?.kid
    const type = options?.type ? options.type : options?.key?.type ? (options.key.type as KeyType) : KeyType.Secp256k1
    const privateKeyHex = options?.key ? options.key.privateKeyHex : this.generatePrivateKeyHex(type)
    const meta = options?.key?.meta ? options.key.meta : {}
    meta['relation'] = relation
    const key: IKey = await context.agent.keyManagerImport({
      kms: kms || this.defaultKms,
      type,
      privateKeyHex,
      kid,
      meta,
    })
    key.privateKeyHex = privateKeyHex

    debug('Created key', type, relation, kid, key.publicKeyHex)

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
