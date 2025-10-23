import { IAgentPlugin } from '@veramo/core'
import { Loggers } from '@sphereon/ssi-types'
import { fetch } from 'cross-fetch'
import type {
  kmsGetResolverArgs,
  KmsListResolversArgs,
  IKmsRestClient,
  KmsResolveKeyArgs,
  KmsCreateRawSignatureArgs,
  KmsGetKeyArgs,
  KmsListKeysArgs,
  KmsStoreKeyArgs,
  KmsGenerateKeyArgs,
  KmsDeleteKeyArgs,
  KmsGetKeyProviderArgs,
  KmsListKeyProvidersArgs,
  KmsProviderListKeysArgs,
  KmsProviderStoreKey,
  KmsProviderGenerateKey,
  KmsProviderGetKeyArgs,
  KmsProviderDeleteKeyArgs,
  RestClientAuthenticationOpts,
  KmsRestClientArgs,
  KmsIsValidRawSignatureArgs,
} from '../types/IKmsRestClient'
import type {
  CreateRawSignature,
  CreateRawSignatureResponse,
  GenerateKey,
  GenerateKeyGlobal,
  ListKeyProvidersResponse,
  ListKeysResponse,
  ListResolversResponse,
  ManagedKeyInfo,
  ManagedKeyPair,
  ResolvedKeyInfo,
  ResolvePublicKey,
  Resolver,
  VerifyRawSignatureResponse,
  StoreKey,
  VerifyRawSignature,
  KeyProviderResponse,
} from '../models'
import {
  CreateRawSignatureToJSONTyped,
  CreateRawSignatureResponseFromJSONTyped,
  GenerateKeyGlobalToJSONTyped,
  GenerateKeyToJSONTyped,
  ListKeyProvidersResponseFromJSONTyped,
  ListKeysResponseFromJSONTyped,
  ListResolversResponseFromJSONTyped,
  ManagedKeyInfoFromJSONTyped,
  ManagedKeyPairFromJSONTyped,
  ResolvePublicKeyToJSONTyped,
  ResolvedKeyInfoFromJSONTyped,
  ResolverFromJSONTyped,
  VerifyRawSignatureResponseFromJSONTyped,
  StoreKeyToJSONTyped,
  VerifyRawSignatureToJSONTyped,
  KeyProviderResponseFromJSONTyped,
} from '../models'

const logger = Loggers.DEFAULT.get('sphereon:ssi-sdk:kms:rest-client')

/**
 * {@inheritDoc IKmsRestClient}
 */
export class KmsRestClient implements IAgentPlugin {
  readonly methods: IKmsRestClient = {
    kmsGetKey: this.kmsGetKey.bind(this),
    kmsListKeys: this.kmsListKeys.bind(this),
    kmsStoreKey: this.kmsStoreKey.bind(this),
    kmsGenerateKey: this.kmsGenerateKey.bind(this),
    kmsDeleteKey: this.kmsDeleteKey.bind(this),

    kmsGetKeyProvider: this.kmsGetKeyProvider.bind(this),
    kmsListKeyProviders: this.kmsListKeyProviders.bind(this),
    kmsProviderListKeys: this.kmsProviderListKeys.bind(this),
    kmsProviderStoreKey: this.kmsProviderStoreKey.bind(this),
    kmsProviderGenerateKey: this.kmsProviderGenerateKey.bind(this),
    kmsProviderGetKey: this.kmsProviderGetKey.bind(this),
    kmsProviderDeleteKey: this.kmsProviderDeleteKey.bind(this),

    kmsGetResolver: this.kmsGetResolver.bind(this),
    kmsListResolvers: this.kmsListResolvers.bind(this),
    kmsResolveKey: this.kmsResolveKey.bind(this),

    kmsCreateRawSignature: this.kmsCreateRawSignature.bind(this),
    kmsIsValidRawSignature: this.kmsIsValidRawSignature.bind(this),
  }

  private readonly agentBaseUrl?: string
  private readonly authOpts?: RestClientAuthenticationOpts

  constructor(args?: KmsRestClientArgs) {
    if (args?.baseUrl) {
      this.agentBaseUrl = args.baseUrl
    }
    this.authOpts = args?.authentication
  }

  private static urlWithBase(path: string, baseUrl: string): string {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }

  /** {@inheritDoc IKmsRestClient.kmsGetResolver} */
  private async kmsGetResolver(args: kmsGetResolverArgs): Promise<Resolver> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/resolvers/${args.resolverId}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get resolver response: ${response}`)

    try {
      return ResolverFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListResolvers} */
  private async kmsListResolvers(args: KmsListResolversArgs): Promise<ListResolversResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase('/resolvers', baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list resolvers response: ${response}`)

    try {
      return ListResolversResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsResolveKey} */
  private async kmsResolveKey(args: KmsResolveKeyArgs): Promise<ResolvedKeyInfo> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/resolvers/${args.resolverId}/resolve`, baseUrl)

    const body = {
      keyInfo: args.keyInfo,
      identifierMethod: args.identifierMethod,
      trustedCerts: args.trustedCerts,
      verifyX509CertificateChain: args.verifyX509CertificateChain,
    } satisfies ResolvePublicKey
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(ResolvePublicKeyToJSONTyped(body)),
    })
    logger.debug(`resolve key response: ${response}`)

    try {
      return ResolvedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsCreateRawSignature} */
  private async kmsCreateRawSignature(args: KmsCreateRawSignatureArgs): Promise<CreateRawSignatureResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/signatures/raw`, baseUrl)

    const body = {
      keyInfo: args.keyInfo,
      input: args.input,
    } satisfies CreateRawSignature
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(CreateRawSignatureToJSONTyped(body)),
    })
    logger.debug(`create raw signature response: ${response}`)

    try {
      return CreateRawSignatureResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsIsValidRawSignature} */
  private async kmsIsValidRawSignature(args: KmsIsValidRawSignatureArgs): Promise<VerifyRawSignatureResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/signatures/raw/verify`, baseUrl)

    const body = {
      keyInfo: args.keyInfo,
      signature: args.signature,
      input: args.input,
    } satisfies VerifyRawSignature
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(VerifyRawSignatureToJSONTyped(body)),
    })
    logger.debug(`verify raw signature response: ${response}`)

    try {
      return VerifyRawSignatureResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsGetKey} */
  private async kmsGetKey(args: KmsGetKeyArgs): Promise<ManagedKeyInfo> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get key response: ${response}`)

    try {
      return ManagedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListKeys} */
  private async kmsListKeys(args: KmsListKeysArgs): Promise<ListKeysResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = this.addSearchParams(KmsRestClient.urlWithBase('/keys', baseUrl), { ...(args.providerId && { providerId: args.providerId }) })
    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list keys response: ${response}`)

    try {
      const xx = await response.json()
      return ListKeysResponseFromJSONTyped(xx, false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsStoreKey} */
  private async kmsStoreKey(args: KmsStoreKeyArgs): Promise<ManagedKeyInfo> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys`, baseUrl)

    const body = {
      keyInfo: args.keyInfo,
      certChain: args.certChain,
    } satisfies StoreKey
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(StoreKeyToJSONTyped(body)),
    })
    logger.debug(`store key response: ${response}`)

    try {
      return ManagedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsGenerateKey} */
  private async kmsGenerateKey(args: KmsGenerateKeyArgs): Promise<ManagedKeyPair> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys/generate`, baseUrl)

    const body = {
      alg: args.alg,
      keyOperations: args.keyOperations,
      providerId: args.providerId,
      use: args.use,
    } satisfies GenerateKeyGlobal
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(GenerateKeyGlobalToJSONTyped(body)),
    })
    logger.debug(`generate key response: ${response}`)

    try {
      return ManagedKeyPairFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsDeleteKey} */
  private async kmsDeleteKey(args: KmsDeleteKeyArgs): Promise<boolean> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys/${args.aliasOrKid}`, baseUrl)

    await fetch(url, {
      method: 'DELETE',
    })

    return true
  }

  /** {@inheritDoc IKmsRestClient.kmsGetKeyProvider} */
  private async kmsGetKeyProvider(args: KmsGetKeyProviderArgs): Promise<KeyProviderResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get provider response: ${response}`)

    try {
      return KeyProviderResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListKeyProviders} */
  private async kmsListKeyProviders(args: KmsListKeyProvidersArgs): Promise<ListKeyProvidersResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase('/providers', baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list providers response: ${response}`)

    try {
      return ListKeyProvidersResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderListKeys} */
  private async kmsProviderListKeys(args: KmsProviderListKeysArgs): Promise<ListKeysResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list provider keys response: ${response}`)

    try {
      return ListKeysResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderStoreKey} */
  private async kmsProviderStoreKey(args: KmsProviderStoreKey): Promise<ManagedKeyInfo> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys`, baseUrl)

    const body = {
      keyInfo: args.keyInfo,
      certChain: args.certChain,
    } satisfies StoreKey
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(StoreKeyToJSONTyped(body)),
    })
    logger.debug(`provider store key response: ${response}`)

    try {
      return ManagedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderGenerateKey} */
  private async kmsProviderGenerateKey(args: KmsProviderGenerateKey): Promise<ManagedKeyPair> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys/generate`, baseUrl)

    const body = {
      alg: args.alg,
      keyOperations: args.keyOperations,
      use: args.use,
    } satisfies GenerateKey
    const response = await fetch(url, {
      method: 'POST',
      headers: await this.createHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(GenerateKeyToJSONTyped(body)),
    })
    logger.debug(`provider generate key response: ${response}`)

    try {
      return ManagedKeyPairFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderGetKey} */
  private async kmsProviderGetKey(args: KmsProviderGetKeyArgs): Promise<ManagedKeyInfo> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get provider key response: ${response}`)

    try {
      return ManagedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderDeleteKey} */
  private async kmsProviderDeleteKey(args: KmsProviderDeleteKeyArgs): Promise<boolean> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`providers/${args.providerId}/keys/${args.aliasOrKid}`, baseUrl)

    await fetch(url, {
      method: 'DELETE',
    })

    return true
  }

  private assertedAgentBaseUrl(baseUrl?: string): string {
    if (baseUrl) {
      return baseUrl
    } else if (this.agentBaseUrl) {
      return this.agentBaseUrl
    }
    throw new Error('No base url has been provided')
  }

  private async createHeaders(existing?: Record<string, any>): Promise<HeadersInit> {
    const headers: HeadersInit = {
      ...existing,
      Accept: 'application/json',
    }
    if (this.authOpts?.enabled === true) {
      if (!this.authOpts.bearerToken) {
        throw Error(`Cannot have authentication enabled, whilst not enabling static bearer tokens at this point`)
      }
      headers.Authorization = `Bearer ${
        typeof this.authOpts.bearerToken === 'string' ? this.authOpts.bearerToken : await this.authOpts.bearerToken()
      }`
    }
    return headers
  }

  private addSearchParams(baseUrl: string, params: Record<string, string | number | boolean>): URL {
    const url = new URL(baseUrl)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }

    return url
  }
}
