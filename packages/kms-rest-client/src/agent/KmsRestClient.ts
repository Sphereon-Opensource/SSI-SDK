import { IAgentPlugin } from '@veramo/core'
import { Loggers } from '@sphereon/ssi-types'
import { fetch } from 'cross-fetch'
import type {
  kmsClientGetResolverArgs,
  KmsClientListResolversArgs,
  IKmsRestClient,
  KmsClientResolveKeyArgs,
  KmsClientCreateRawSignatureArgs,
  KmsClientGetKeyArgs,
  KmsClientListKeysArgs,
  KmsClientStoreKeyArgs,
  KmsClientGenerateKeyArgs,
  KmsClientDeleteKeyArgs,
  KmsClientGetKeyProviderArgs,
  KmsClientListKeyProvidersArgs,
  KmsClientProviderListKeysArgs,
  KmsClientProviderStoreKeyArgs,
  KmsClientProviderGenerateKeyArgs,
  KmsClientProviderGetKeyArgs,
  KmsClientProviderDeleteKeyArgs,
  RestClientAuthenticationOpts,
  KmsRestClientArgs,
  KmsClientIsValidRawSignatureArgs,
} from '../types/IKmsRestClient'
import type {
  CreateRawSignature,
  CreateRawSignatureResponse,
  GenerateKey,
  GenerateKeyGlobal,
  ListKeyProvidersResponse,
  ListKeysResponse,
  ListResolversResponse,
  ResolvedKeyInfo,
  ResolvePublicKey,
  Resolver,
  VerifyRawSignatureResponse,
  StoreKey,
  VerifyRawSignature,
  KeyProviderResponse,
  GenerateKeyResponse,
  StoreKeyResponse,
  GetKeyResponse
} from '../models'
import {
  CreateRawSignatureResponseFromJSONTyped,
  CreateRawSignatureToJSONTyped,
  GenerateKeyGlobalToJSONTyped,
  GenerateKeyToJSONTyped,
  GenerateKeyResponseFromJSONTyped,
  GetKeyResponseFromJSONTyped,
  KeyProviderResponseFromJSONTyped,
  ListKeyProvidersResponseFromJSONTyped,
  ListKeysResponseFromJSONTyped,
  ListResolversResponseFromJSONTyped,
  ResolvePublicKeyToJSONTyped,
  ResolvedKeyInfoFromJSONTyped,
  ResolverFromJSONTyped,
  StoreKeyToJSONTyped,
  StoreKeyResponseFromJSONTyped,
  VerifyRawSignatureResponseFromJSONTyped,
  VerifyRawSignatureToJSONTyped
} from '../models'

const logger = Loggers.DEFAULT.get('sphereon:ssi-sdk:kms:rest-client')

/**
 * {@inheritDoc IKmsRestClient}
 */
export class KmsRestClient implements IAgentPlugin {
  readonly methods: IKmsRestClient = {
    kmsClientGetKey: this.kmsClientGetKey.bind(this),
    kmsClientListKeys: this.kmsClientListKeys.bind(this),
    kmsClientStoreKey: this.kmsClientStoreKey.bind(this),
    kmsClientGenerateKey: this.kmsClientGenerateKey.bind(this),
    kmsClientDeleteKey: this.kmsClientDeleteKey.bind(this),

    kmsClientGetKeyProvider: this.kmsClientGetKeyProvider.bind(this),
    kmsClientListKeyProviders: this.kmsClientListKeyProviders.bind(this),
    kmsClientProviderListKeys: this.kmsClientProviderListKeys.bind(this),
    kmsClientProviderStoreKey: this.kmsClientProviderStoreKey.bind(this),
    kmsClientProviderGenerateKey: this.kmsClientProviderGenerateKey.bind(this),
    kmsClientProviderGetKey: this.kmsClientProviderGetKey.bind(this),
    kmsClientProviderDeleteKey: this.kmsClientProviderDeleteKey.bind(this),

    kmsClientGetResolver: this.kmsClientGetResolver.bind(this),
    kmsClientListResolvers: this.kmsClientListResolvers.bind(this),
    kmsClientResolveKey: this.kmsClientResolveKey.bind(this),

    kmsClientCreateRawSignature: this.kmsClientCreateRawSignature.bind(this),
    kmsClientIsValidRawSignature: this.kmsClientIsValidRawSignature.bind(this),
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
  private async kmsClientGetResolver(args: kmsClientGetResolverArgs): Promise<Resolver> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/resolvers/${args.resolverId}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get resolver response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ResolverFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListResolvers} */
  private async kmsClientListResolvers(args?: KmsClientListResolversArgs): Promise<ListResolversResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args?.baseUrl)
    const url = KmsRestClient.urlWithBase('/resolvers', baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list resolvers response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ListResolversResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsResolveKey} */
  private async kmsClientResolveKey(args: KmsClientResolveKeyArgs): Promise<ResolvedKeyInfo> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ResolvedKeyInfoFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsCreateRawSignature} */
  private async kmsClientCreateRawSignature(args: KmsClientCreateRawSignatureArgs): Promise<CreateRawSignatureResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return CreateRawSignatureResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsIsValidRawSignature} */
  private async kmsClientIsValidRawSignature(args: KmsClientIsValidRawSignatureArgs): Promise<VerifyRawSignatureResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return VerifyRawSignatureResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsGetKey} */
  private async kmsClientGetKey(args: KmsClientGetKeyArgs): Promise<GetKeyResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get key response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return GetKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListKeys} */
  private async kmsClientListKeys(args?: KmsClientListKeysArgs): Promise<ListKeysResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args?.baseUrl)
    const url = this.addSearchParams(KmsRestClient.urlWithBase('/keys', baseUrl), { ...(args?.providerId && { providerId: args.providerId }) })
    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list keys response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ListKeysResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsStoreKey} */
  private async kmsClientStoreKey(args: KmsClientStoreKeyArgs): Promise<StoreKeyResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return StoreKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsGenerateKey} */
  private async kmsClientGenerateKey(args: KmsClientGenerateKeyArgs): Promise<GenerateKeyResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return GenerateKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsDeleteKey} */
  private async kmsClientDeleteKey(args: KmsClientDeleteKeyArgs): Promise<boolean> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'DELETE',
    })
    logger.debug(`delete key response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }

    return true
  }

  /** {@inheritDoc IKmsRestClient.kmsGetKeyProvider} */
  private async kmsClientGetKeyProvider(args: KmsClientGetKeyProviderArgs): Promise<KeyProviderResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get provider response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return KeyProviderResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsListKeyProviders} */
  private async kmsClientListKeyProviders(args?: KmsClientListKeyProvidersArgs): Promise<ListKeyProvidersResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args?.baseUrl)
    const url = KmsRestClient.urlWithBase('/providers', baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list providers response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ListKeyProvidersResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderListKeys} */
  private async kmsClientProviderListKeys(args: KmsClientProviderListKeysArgs): Promise<ListKeysResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`list provider keys response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return ListKeysResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderStoreKey} */
  private async kmsClientProviderStoreKey(args: KmsClientProviderStoreKeyArgs): Promise<StoreKeyResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return StoreKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderGenerateKey} */
  private async kmsClientProviderGenerateKey(args: KmsClientProviderGenerateKeyArgs): Promise<GenerateKeyResponse> {
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
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return GenerateKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderGetKey} */
  private async kmsClientProviderGetKey(args: KmsClientProviderGetKeyArgs): Promise<GetKeyResponse> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`/providers/${args.providerId}/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'GET',
    })
    logger.debug(`get provider key response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }

      return GetKeyResponseFromJSONTyped(await response.json(), false)
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }
  }

  /** {@inheritDoc IKmsRestClient.kmsProviderDeleteKey} */
  private async kmsClientProviderDeleteKey(args: KmsClientProviderDeleteKeyArgs): Promise<boolean> {
    const baseUrl = this.assertedAgentBaseUrl(args.baseUrl)
    const url = KmsRestClient.urlWithBase(`providers/${args.providerId}/keys/${args.aliasOrKid}`, baseUrl)

    const response = await fetch(url, {
      method: 'DELETE',
    })
    logger.debug(`delete key response: ${response}`)

    try {
      if (!response.ok) {
        return Promise.reject(await response.json())
      }
    } catch (error) {
      return Promise.reject(Error(`request to ${url} returned ${error}`))
    }

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
