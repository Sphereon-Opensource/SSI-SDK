import { getControllerKey, getEthereumAddressFromKey } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, calculateJwkThumbprintForKey, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IDIDManager, IIdentifier, IKeyManager } from '@veramo/core'
import { IKey, IService } from '@veramo/core'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import Debug from 'debug'
import { ApiOpts, IRequiredContext } from '../types/IEbsiSupport'
import {
  ebsiCreateDidOnLedger,
  ebsiGenerateOrUseKeyPair,
  ebsiSignAndSendTransaction,
  formatEbsiPublicKey,
  generateEbsiMethodSpecificId,
  randomRpcId,
} from './functions'
import { EBSI_DID_SPEC_INFOS, EbsiRpcMethod, ICreateIdentifierArgs, UpdateIdentifierParams } from './types'

const debug = Debug('sphereon:did-provider-ebsi')

export class EbsiDidProvider extends AbstractIdentifierProvider {
  static readonly PROVIDER = 'did:ebsi'
  private readonly defaultKms?: string
  private readonly apiOpts?: ApiOpts

  constructor(options: { defaultKms?: string; apiOpts?: ApiOpts }) {
    super()
    this.defaultKms = options.defaultKms
    this.apiOpts = options.apiOpts
  }

  async createIdentifier(args: ICreateIdentifierArgs, context: IRequiredContext): Promise<Omit<IIdentifier, 'provider'>> {
    const { type, options, kms = this.defaultKms, alias } = args
    const {
      notBefore,
      notAfter,
      secp256k1Key,
      secp256r1Key,
      keys,
      accessTokenOpts,
      executeLedgerOperation = !!args.options?.accessTokenOpts,
      methodSpecificId = generateEbsiMethodSpecificId(EBSI_DID_SPEC_INFOS.V1),
      baseDocument,
      services,
    } = { ...options }

    if (executeLedgerOperation && !accessTokenOpts) {
      throw new Error('Access token options must be provided to execute ledger operation')
    }
    const rpcId = options?.rpcId ?? randomRpcId()

    if (type === EBSI_DID_SPEC_INFOS.KEY) {
      return Promise.reject(Error(`Type ${type} not supported. Please use @sphereon/ssi-sdk-ext.did-provider-key for Natural Person EBSI DIDs`))
    } else if (!kms) {
      return Promise.reject(Error(`No KMS value provided`))
    } else if (keys && keys.length > 0 && !executeLedgerOperation) {
      return Promise.reject(Error(`Cannot add additional keys if ledger operation is not enabled at creation. Please add the keys later yourself`))
    }

    // CapabilityInvocation purpose
    const secp256k1ImportKey = await ebsiGenerateOrUseKeyPair(
      {
        keyOpts: secp256k1Key,
        keyType: 'Secp256k1',
        kms,
        controllerKey: true,
      },
      context,
    )
    const secp256k1ManagedKeyInfo = await context.agent.keyManagerImport(secp256k1ImportKey)

    // Authentication, assertionMethod purpose
    const secp256r1ImportKey = await ebsiGenerateOrUseKeyPair(
      {
        keyOpts: secp256r1Key,
        keyType: 'Secp256r1',
        kms,
      },
      context,
    )

    const secp256r1ManagedKeyInfo = await context.agent.keyManagerImport(secp256r1ImportKey)

    const identifier: IIdentifier = {
      did: options.did && options.did.startsWith('did:ebsi:') ? options.did : `${EBSI_DID_SPEC_INFOS.V1.method}${methodSpecificId}`,
      controllerKeyId: secp256k1ManagedKeyInfo.kid,
      keys: [secp256k1ManagedKeyInfo, secp256r1ManagedKeyInfo],
      alias,
      services: services ?? [],
      provider: EbsiDidProvider.PROVIDER,
    }

    const apiOpts = { ...this.apiOpts }
    if (!apiOpts.environment) {
      apiOpts.environment = accessTokenOpts?.environment ?? 'pilot'
    }
    if (!apiOpts.version) {
      apiOpts.version = 'v5'
    }

    if (executeLedgerOperation) {
      // This can only work if we enable global jwks hosting. DID JWK hosting will not work as the DID is not registered at this point
      await ebsiCreateDidOnLedger(
        {
          identifier,
          baseDocument,
          accessTokenOpts: accessTokenOpts!,
          rpcId,
          notBefore,
          notAfter,
        },
        context,
      )
      if (keys && keys.length > 0) {
        for (const keyOpts of keys) {
          const key = await ebsiGenerateOrUseKeyPair(
            {
              keyOpts,
              keyType: keyOpts.type ?? 'Secp256r1',
              kms,
            },
            context,
          )
          const managedKeyInfo = await context.agent.keyManagerImport(key)
          console.warn(`FIXME: Anchor additional key on EBSI`, managedKeyInfo)
        }
      }
    }

    debug('Created', identifier.did)
    return identifier
  }

  async addKey(
    args: {
      identifier: IIdentifier
      key: IKey
      options: {
        rpcId?: number
        accessToken: string
        vmRelationships: 'authentication' | 'assertionMethod' | 'keyAgreement' | 'capabilityInvocation' | 'capabilityDelegation'[]
        apiOpts?: ApiOpts
      }
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<any> {
    const { identifier, key, options } = args
    const { accessToken, vmRelationships, apiOpts, rpcId = randomRpcId() } = options
    if (vmRelationships.length === 0) {
      return Promise.reject(Error(`No verification method relationship provided`))
    }
    const controllerKey = getControllerKey({ identifier })
    const from = getEthereumAddressFromKey({ key: controllerKey })
    const kid = controllerKey.kid
    const did = identifier.did

    const addVerificationMethodRequest = {
      params: [
        {
          from,
          did,
          isSecp256k1: true,
          vMethodId: calculateJwkThumbprint({ jwk: toJwk(key.publicKeyHex, key.type) }),
          publicKey: formatEbsiPublicKey({ key: key, type: key.type }),
        },
      ],
      rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_METHOD,
      rpcId,
      apiOpts,
      accessToken,
    }

    let rpcResponse = await ebsiSignAndSendTransaction(
      {
        rpcRequest: addVerificationMethodRequest,
        kid,
        accessToken: accessToken,
        apiOpts,
      },
      context,
    )

    const vMethodId = calculateJwkThumbprintForKey({ key })
    for (const vmRelationshipsKey in vmRelationships as string[]) {
      const addVerificationMethodRelationshipRequest = {
        params: [
          {
            from,
            did,
            vMethodId,
            name: vmRelationshipsKey,
            notAfter: Date.now() / 1000 - 60_000,
            notBefore: Date.now() / 1000 + 5 * 365 * 24 * 60 * 60,
          },
        ],
        rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_RELATIONSHIP,
        rpcId,
        apiOpts,
        accessToken,
      }
      rpcResponse = await ebsiSignAndSendTransaction(
        {
          rpcRequest: addVerificationMethodRelationshipRequest,
          previousTxResponse: rpcResponse,
          kid,
          accessToken,
          apiOpts,
        },
        context,
      )
    }
  }

  async addService(
    args: {
      identifier: IIdentifier
      service: IService
      options: {
        rpcId?: number
        accessToken: string
        apiOpts?: ApiOpts
      }
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<any> {
    const { identifier, service, options } = args
    const { accessToken, apiOpts, rpcId = randomRpcId() } = options
    const controllerKey = getControllerKey({ identifier })
    const from = getEthereumAddressFromKey({ key: controllerKey })
    const did = identifier.did
    const kid = controllerKey.kid

    const addServiceRequest = {
      params: [
        {
          from,
          did,
          service,
        },
      ],
      rpcMethod: EbsiRpcMethod.ADD_SERVICE,
      rpcId,
      apiOpts,
      accessToken,
    }

    return await ebsiSignAndSendTransaction(
      {
        rpcRequest: addServiceRequest,
        kid,
        accessToken,
        apiOpts,
      },
      context,
    )
  }

  deleteIdentifier(args: IIdentifier, context: IAgentContext<IKeyManager>): Promise<boolean> {
    return Promise.resolve(true)
  }

  removeKey(
    args: {
      identifier: IIdentifier
      kid: string
      options?: any
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<any> {
    throw new Error(`Not (yet) implemented for the EBSI did provider`)
  }

  removeService(
    args: {
      identifier: IIdentifier
      id: string
      options?: any
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<any> {
    throw new Error(`Not (yet) implemented for the EBSI did provider`)
  }

  // TODO How does it work? Not inferable from the api: https://hub.ebsi.eu/apis/pilot/did-registry/v5/post-jsonrpc#updatebasedocument
  async updateIdentifier(args: UpdateIdentifierParams, context: IAgentContext<IKeyManager & IDIDManager>): Promise<IIdentifier> {
    throw new Error(`Not (yet) implemented for the EBSI did provider`)
  }
}
