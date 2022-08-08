import { DIDResolutionResult, IAgentContext, IIdentifier, IKey, IKeyManager, IService, ManagedKeyInfo } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'

import Debug from 'debug'
import {
  IAddKeyOpts,
  IContext,
  ICreateIdentifierOpts,
  IKeyRotation,
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
  toIonPublicKey,
  generatePrivateKeyHex,
  getActionTimestamp,
  ionDidSuffixFromLong,
  ionLongFormDidFromCreation,
  computeCommitmentFromIonPublicKey,
  ionShortFormDidFromLong,
  tempMemoryKey,
  toIonPublicKeyJwk,
  toJwkEs256k,
  truncateKidIfNeeded,
  getVeramoRecoveryKey,
  getVeramoUpdateKey,
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
    context: IAgentContext<IKeyManager>
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const actionId = getActionTimestamp(options?.actionId)

    const recoveryKey = await this.importProvidedOrGeneratedKey(
      {
        kms,
        actionId,
        relation: KeyIdentifierRelation.RECOVERY,
        options: options?.recoveryKey,
      },
      context
    )
    const updateKey = await this.importProvidedOrGeneratedKey(
      {
        kms,
        actionId,
        relation: KeyIdentifierRelation.UPDATE,
        options: options?.updateKey,
      },
      context
    )

    // No options or no verification method options, results in us generating a single key as the only authentication verification method in the DID
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
      const key = await this.importProvidedOrGeneratedKey(
        {
          kms,
          actionId,
          relation: KeyIdentifierRelation.DID,
          options: verificationMethod,
        },
        context
      )
      veramoKeys.push(key)
      ionPublicKeys.push(toIonPublicKey(key, verificationMethod.purposes))
    }

    const services = options?.services ? options.services : undefined

    const createRequest = {
      recoveryKey: toIonPublicKeyJwk(recoveryKey.publicKeyHex),
      updateKey: toIonPublicKeyJwk(updateKey.publicKeyHex),
      document: {
        publicKeys: ionPublicKeys,
        services,
      },
    }
    const longFormDid = ionLongFormDidFromCreation(createRequest)
    const shortFormDid = ionShortFormDidFromLong(longFormDid)
    if (!options?.anchor) {
      debug(`Not anchoring DID ${shortFormDid} as anchoring was not enabled`)
    } else {
      const request = IonRequest.createCreateRequest(createRequest)
      await this.ionPoW.submit(JSON.stringify(request))
    }

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
    const didResolution = await this.getAssertedDidDocument(identifier, IonDidForm.LONG)
    const recoveryKey = getVeramoRecoveryKey(identifier.keys, didResolution.didDocumentMetadata.method.recoveryCommitment)
    const request = await IonRequest.createDeactivateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      recoveryPublicKey: toJwkEs256k(toIonPublicKeyJwk(recoveryKey.publicKeyHex)),
      signer: new IonSigner(context, recoveryKey.kid),
    })

    await this.ionPoW.submit(JSON.stringify(request))

    for (const { kid } of identifier.keys) {
      await context.agent.keyManagerDelete({ kid })
    }
    return true
  }

  async addKey({ identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: IAddKeyOpts }, context: IContext): Promise<any> {
    if (!options) {
      throw Error('Add key needs options, since we need to know the purpose(s) of the key')
    }
    const rotation = await this.rotateKey({ identifier, options, kms: key.kms, context })

    const request = await IonRequest.createUpdateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      updatePublicKey: rotation.currentJwk,
      nextUpdatePublicKey: rotation.nextJwk,
      signer: new IonSigner(context, rotation.currentVeramoKey.kid),
      publicKeysToAdd: [
        {
          ...toIonPublicKey(key, options.purposes),
        },
      ],
    })

    try {
      await this.ionPoW.submit(JSON.stringify(request))
      return `${identifier.did}#${key.kid}`
    } catch (error) {
      // It would have been nicer if we hadn't stored the new update key yet
      await context.agent.keyManagerDelete({ kid: rotation.nextVeramoKey.kid })
      throw error
    }
  }

  async addService(
    { identifier, service, options }: { identifier: IIdentifier; service: IService; options?: IUpdateOpts },
    context: IContext
  ): Promise<any> {
    const rotation = await this.rotateKey({ identifier, options, context })

    const request = await IonRequest.createUpdateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      updatePublicKey: rotation.currentJwk,
      nextUpdatePublicKey: rotation.nextJwk,
      signer: new IonSigner(context, rotation.currentVeramoKey.kid),
      servicesToAdd: [
        {
          ...service,
        },
      ],
    })

    try {
      await this.ionPoW.submit(JSON.stringify(request))
      return `${identifier.did}#${service.id}`
    } catch (error) {
      // It would have been nicer if we hadn't stored the new update key yet
      await context.agent.keyManagerDelete({ kid: rotation.nextVeramoKey.kid })
      throw error
    }
  }

  async removeKey({ identifier, kid, options }: { identifier: IIdentifier; kid: string; options?: IUpdateOpts }, context: IContext): Promise<any> {
    const rotation = await this.rotateKey({ identifier, options, context })

    const request = await IonRequest.createUpdateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      updatePublicKey: rotation.currentJwk,
      nextUpdatePublicKey: rotation.nextJwk,
      signer: new IonSigner(context, rotation.currentVeramoKey.kid),
      idsOfPublicKeysToRemove: [truncateKidIfNeeded(kid)],
    })

    try {
      await this.ionPoW.submit(JSON.stringify(request))
      return `${identifier.did}#${kid}`
    } catch (error) {
      // It would have been nicer if we hadn't stored the new update key yet
      await context.agent.keyManagerDelete({ kid: rotation.nextVeramoKey.kid })
      throw error
    }
  }

  async removeService({ identifier, id, options }: { identifier: IIdentifier; id: string; options?: IUpdateOpts }, context: IContext): Promise<any> {
    const rotation = await this.rotateKey({ identifier, options, context })

    const request = await IonRequest.createUpdateRequest({
      didSuffix: ionDidSuffixFromLong(identifier.did),
      updatePublicKey: rotation.currentJwk,
      nextUpdatePublicKey: rotation.nextJwk,
      signer: new IonSigner(context, rotation.currentVeramoKey.kid),
      idsOfServicesToRemove: [truncateKidIfNeeded(id)],
    })

    try {
      await this.ionPoW.submit(JSON.stringify(request))
      return `${identifier.did}#${id}`
    } catch (error) {
      // It would have been nicer if we hadn't stored the new update key yet
      await context.agent.keyManagerDelete({ kid: rotation.nextVeramoKey.kid })
      throw error
    }
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
    context: IAgentContext<IKeyManager>
  ): Promise<IKeyRotation> {
    const currentVeramoKey =
      relation == KeyIdentifierRelation.UPDATE ? getVeramoUpdateKey(identifier.keys, commitment) : getVeramoRecoveryKey(identifier.keys, commitment)
    const currentIonKey = toIonPublicKey(currentVeramoKey)
    const currentJwk = toIonPublicKeyJwk(currentVeramoKey.publicKeyHex)
    //todo alias, todo: do not store the updated key yet
    const nextVeramoKey = await this.importProvidedOrGeneratedKey({ kms, actionId, relation, options }, context)
    const nextIonKey = toIonPublicKey(nextVeramoKey)
    const nextJwk = toIonPublicKeyJwk(nextVeramoKey.publicKeyHex)

    return { currentIonKey, currentVeramoKey, currentJwk, nextJwk, nextIonKey, nextVeramoKey }
  }

  private async rotateKey({
    kms,
    context,
    options,
    identifier,
  }: {
    identifier: IIdentifier
    options?: IUpdateOpts
    kms?: string
    context: IContext
  }) {
    const didResolution = await this.getAssertedDidDocument(identifier, IonDidForm.LONG)
    const currentUpdateKey = getVeramoUpdateKey(identifier.keys, didResolution.didDocumentMetadata.method.updateCommitment)
    const commitment = computeCommitmentFromIonPublicKey(toIonPublicKey(currentUpdateKey))
    const actionId = getActionTimestamp(options?.actionId)

    const rotation = await this.rotateUpdateOrRecoveryKey(
      {
        identifier,
        commitment,
        relation: KeyIdentifierRelation.UPDATE,
        actionId,
        kms: kms ? kms : this.defaultKms,
        options: {},
      },
      context
    )
    return rotation
  }

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
  private async importProvidedOrGeneratedKey(
    { kms, actionId, relation, options }: { kms?: string; actionId: number; relation: KeyIdentifierRelation; options?: KeyOpts | VerificationMethod },
    context: IAgentContext<IKeyManager>
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
      const tmpKey = await tempMemoryKey(type, privateKeyHex, kid!, kms ? kms : this.defaultKms, ionMeta)
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
