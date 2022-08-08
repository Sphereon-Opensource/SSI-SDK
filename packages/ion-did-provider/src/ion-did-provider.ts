import {
  DIDResolutionResult,
  IAgentContext,
  IIdentifier,
  IKey,
  IKeyManager,
  IService,
  ManagedKeyInfo,
} from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'

import Debug from 'debug'
import {
  IContext,
  ICreateIdentifierOpts,
  IonDidForm,
  IonKeyMetadata,
  IUpdateOpts,
  KeyIdentifierRelation,
  KeyOpts,
  KeyType,
  VerificationMethod,
} from './types/ion-provider-types'

import { IonSigner } from './ion-signer'
import { resolveDidIonFromIdentifier } from './ion-did-resolver'

import { IonPublicKeyModel, IonPublicKeyPurpose, IonRequest } from '@decentralized-identity/ion-sdk'
import {
  createIonPublicKey,
  generatePrivateKeyHex,
  getActionId,
  ionDidSuffixFromLong,
  ionLongFormDidFromCreation,
  ionPublicKeyToCommitment,
  ionRecoveryKey,
  ionShortFormDidFromLong,
  ionUpdateKey,
  tmpMemoryKey,
  toIonPublicKeyJwk,
  toJwkEs256k,
} from './functions'
import { IonProofOfWork } from './IonPow'

const debug = Debug('veramo:ion-did-provider')


/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:ion` identifiers
 * @public
 */
export class IonDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string
  private readonly ionPoW: IonProofOfWork

  constructor(options: { defaultKms: string }) {
    super()
    this.defaultKms = options.defaultKms
    this.ionPoW = new IonProofOfWork()
  }

  async createIdentifier(
    { kms, options, alias }: { kms?: string; alias?: string; options?: ICreateIdentifierOpts },
    context: IAgentContext<IKeyManager>,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const actionId = getActionId(options?.actionId)

    const recoveryKey = await this.importKey(
      {
        kms,
        actionId,
        relation: KeyIdentifierRelation.RECOVERY,
        options: options?.recoveryKey,
      },
      context,
    )
    const updateKey = await this.importKey(
      {
        kms,
        actionId,
        relation: KeyIdentifierRelation.UPDATE,
        options: options?.updateKey,
      },
      context,
    )

    // No options or no key options, results in generating a single key as the only authentication verification method in the DID
    const verificationMethods = options?.verificationMethods
      ? options.verificationMethods
      : [
        {
          type: KeyType.Secp256k1,
          purposes: [IonPublicKeyPurpose.Authentication],
        },
      ]

    const veramoKeys: ManagedKeyInfo[] = [recoveryKey, updateKey]
    const ionPublicKeys: IonPublicKeyModel[] = []
    for (const verificationMethod of verificationMethods) {
      const key = await this.importKey(
        {
          kms,
          actionId,
          relation: KeyIdentifierRelation.DID,
          options: verificationMethod,
        },
        context,
      )
      veramoKeys.push(key)
      ionPublicKeys.push(createIonPublicKey(key, verificationMethod.purposes))
    }

    const services = options?.services ? options.services : undefined

    // TODO: Add nonce support to JWKs: https://identity.foundation/sidetree/spec/#jwk-nonce
    const createInput = {
      recoveryKey: toIonPublicKeyJwk(recoveryKey.publicKeyHex),
      updateKey: toIonPublicKeyJwk(updateKey.publicKeyHex),
      document: {
        publicKeys: ionPublicKeys,
        services,
      },
    }
    const longFormDid = ionLongFormDidFromCreation(createInput)
    const shortFormDid = ionShortFormDidFromLong(longFormDid)
    if (!options?.anchor) {
      debug(`Not anchoring DID ${shortFormDid} as anchoring was not enabled`)
    } else {
      const request = IonRequest.createCreateRequest(createInput)

      console.log(`did: ${longFormDid}`)
      console.log('###############')
      console.log('requestBody (Create):')
      console.log(JSON.stringify(request, null, 2))
      console.log('###############')

      const response = await this.ionPoW.submit(JSON.stringify(request))

      console.log('###############')
      console.log('response (Create):')
      console.log(JSON.stringify(response, null, 2))
      console.log('###############')
    }

    console.log(`--- LONG create:  ${longFormDid}`)

    const identifier: Omit<IIdentifier, 'provider'> = {
      did: longFormDid,
      controllerKeyId: updateKey.kid,
      alias: shortFormDid,
      keys: veramoKeys,

      services: services ? services : [],
    }

    debug('Created DID (short, long form): ', identifier.alias, identifier.did)
    return identifier
  }

  async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  private async getAssertedDidDocument(identifier: IIdentifier, didForm: IonDidForm = IonDidForm.LONG): Promise<DIDResolutionResult> {
    const didDocument = await resolveDidIonFromIdentifier(identifier, didForm)
    if (!didDocument) {
      return Promise.reject(Error(`Could not resolve existing DID document for did ${identifier.did}`))
    }
    return didDocument
  }

  private async rotateUpdateOrRecoveryKey(
    {
      identifier,
      commitment,
      relation,
      kms,
      options,
      actionId,
    }: {
      identifier: IIdentifier
      commitment: string
      actionId: number
      relation: KeyIdentifierRelation
      kms?: string
      alias?: string
      options?: KeyOpts
    },
    context: IAgentContext<IKeyManager>,
  ) {
    const currentKey =
      relation == KeyIdentifierRelation.UPDATE ? ionUpdateKey(identifier.keys, commitment) : ionRecoveryKey(identifier.keys, commitment)
    const currentJwk = toJwkEs256k(currentKey.publicKeyJwk)
    //todo alias
    const nextVeramoKey = await this.importKey({ kms, actionId, relation, options }, context)
    const nextKey = createIonPublicKey(nextVeramoKey, [])
    const nextJwk = toIonPublicKeyJwk(nextVeramoKey.publicKeyHex)

    return { currentKey, currentJwk, nextJwk, nextKey }
  }

  async addKey({
                 identifier,
                 key,
                 options,
               }: { identifier: IIdentifier; key: IKey; options?: IUpdateOpts }, context: IContext): Promise<any> {

    const didResolution = await this.getAssertedDidDocument(identifier, IonDidForm.LONG)
    const currentUpdateKey = ionUpdateKey(identifier.keys, didResolution.didDocumentMetadata.method.updateCommitment)
    const commitment = ionPublicKeyToCommitment(currentUpdateKey)
    const actionId = getActionId(options?.actionId)

    console.log(`DID Resolution:\r\n${JSON.stringify(didResolution)}`)

    const rotation = await this.rotateUpdateOrRecoveryKey(
      {
        identifier,
        commitment,
        relation: KeyIdentifierRelation.UPDATE,
        actionId,
        kms: key.kms ? key.kms : this.defaultKms,
        options: { },
      },
      context,
    )

    /*
    // const updateKey = ionUpdateKey(identifier.keys, didResolution.didDocumentMetadata.method.updateCommitment)
    if (!rotation.currentJwk) {
      return Promise.reject(Error(`Could not retrieve current update key for identifier ${identifier.did}`))
    }
*/

    const request = await IonRequest.createUpdateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      updatePublicKey: rotation.currentJwk,
      nextUpdatePublicKey: rotation.nextJwk,
      signer: new IonSigner(context, rotation.currentKey.id),
      publicKeysToAdd: [
        {
          ...createIonPublicKey(key, [IonPublicKeyPurpose.CapabilityDelegation]),
        },
      ],
    })

    const response = await this.ionPoW.submit(JSON.stringify(request))

    console.log(JSON.stringify(response, null, 2))
    return `${identifier.did}#${key.kid}`
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

  /*
  private async ionOps(identifier: IIdentifier) {
    const publicKeys = ionKeysOfType(identifier.keys, KeyIdentifierRelation.DID)
    const recoveryKey = ionRecoveryKey(identifier.keys, 'genesis')
    const recoveryPublicJwk = recoveryKey!.publicKeyJwk
    const updateKey = ionUpdateKey(identifier.keys, 'genesis')
    const updatePublicJwk = updateKey!.publicKeyJwk

    // fixme: Get services
    // Ensure we get the LONG form create
    // const resolution = await resolveDidIonFromIdentifier(identifier, IonDidForm.LONG)
    // const didDocument = resolution.didDocument

    return [
      {
        operation: 'create',
        content: {
          publicKeys,
          // services: []
        },
        recovery: { publicJwk: recoveryPublicJwk },
        update: { publicJwk: updatePublicJwk },
      },
    ]
  }
*/

  /**
   * We optionally generate and then import our own keys.
   *
   * Reason for this is that we want to be able to assign Key IDs (kid), which Veramo supports on import, but not creation. The net result is that we do not support keys which have been created from keyManagerCreate
   * @param kms
   * @param actionId
   * @param relation
   * @param options
   * @param context
   * @private
   */
  private async importKey(
    {
      kms,
      actionId,
      relation,
      options,
    }: { kms?: string; actionId: number; relation: KeyIdentifierRelation; options?: KeyOpts | VerificationMethod },
    context: IAgentContext<IKeyManager>,
  ): Promise<IKey> {
    const kid = options?.kid ? options.kid : options?.key?.kid
    const type = options?.type ? options.type : options?.key?.type ? (options.key.type as KeyType) : KeyType.Secp256k1


    const meta = options?.key?.meta ? options.key.meta : {}
    const ionMeta: IonKeyMetadata = {
      relation,
      actionId,
    }
    if (options && 'purposes' in options) {
      ionMeta.purposes = options.purposes
    }
    let privateKeyHex: string
    if (options?.key) {
      if (!options.key.privateKeyHex) {
        throw new Error(`We need to have a private key when importing a recovery or update key. Key ${kid} did not have one`)
      }
      privateKeyHex = options.key.privateKeyHex
    } else {
      privateKeyHex = generatePrivateKeyHex(type)
    }
    if (relation === KeyIdentifierRelation.RECOVERY || relation === KeyIdentifierRelation.UPDATE) {

      // We need a commitment for these keys. As they are based on the publicKey let's create an in mem key
      const tmpKey = await tmpMemoryKey(type, privateKeyHex, kid!, kms ? kms : this.defaultKms, ionMeta)
      ionMeta.commitment = tmpKey.meta!.ion.commitment
    }
    meta.ion = ionMeta

    const key: IKey = await context.agent.keyManagerImport({
      kms: kms || this.defaultKms,
      type,
      privateKeyHex,
      kid,
      meta,
    })
    // We need it in case we are importing it again in the same call
    // key.privateKeyHex = privateKeyHex

    debug('Created key', type, relation, kid, key.publicKeyHex)

    return key
  }
}
