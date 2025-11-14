import type { BearerTokenArg } from '@sphereon/ssi-types'
import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import {
  CreateRawSignature,
  CreateRawSignatureResponse,
  GenerateKey,
  GenerateKeyGlobal,
  GenerateKeyResponse,
  GetKeyResponse,
  KeyProviderResponse,
  ListKeyProvidersResponse,
  ListKeysResponse,
  ListResolversResponse,
  ResolvedKeyInfo,
  ResolvePublicKey,
  Resolver,
  StoreKey,
  StoreKeyResponse,
  VerifyRawSignature,
  VerifyRawSignatureResponse,
} from '../models'

export interface IKmsRestClient extends IPluginMethodMap {
  kmsClientGetResolver(args: KmsClientGetResolverArgs): Promise<Resolver>
  kmsClientListResolvers(args?: KmsClientListResolversArgs): Promise<ListResolversResponse>
  kmsClientResolveKey(args: KmsClientResolveKeyArgs): Promise<ResolvedKeyInfo>
  kmsClientCreateRawSignature(args: KmsClientCreateRawSignatureArgs): Promise<CreateRawSignatureResponse>
  kmsClientIsValidRawSignature(args: KmsClientIsValidRawSignatureArgs): Promise<VerifyRawSignatureResponse>
  kmsClientGetKey(args: KmsClientGetKeyArgs): Promise<GetKeyResponse>
  kmsClientListKeys(args?: KmsClientListKeysArgs): Promise<ListKeysResponse>
  kmsClientStoreKey(args: KmsClientStoreKeyArgs): Promise<StoreKeyResponse>
  kmsClientGenerateKey(args: KmsClientGenerateKeyArgs): Promise<GenerateKeyResponse>
  kmsClientDeleteKey(args: KmsClientDeleteKeyArgs): Promise<boolean>
  kmsClientGetKeyProvider(args: KmsClientGetKeyProviderArgs): Promise<KeyProviderResponse>
  kmsClientListKeyProviders(args?: KmsClientListKeyProvidersArgs): Promise<ListKeyProvidersResponse>
  kmsClientProviderListKeys(args: KmsClientProviderListKeysArgs): Promise<ListKeysResponse>
  kmsClientProviderStoreKey(args: KmsClientProviderStoreKeyArgs): Promise<StoreKeyResponse>
  kmsClientProviderGenerateKey(args: KmsClientProviderGenerateKeyArgs): Promise<GenerateKeyResponse>
  kmsClientProviderGetKey(args: KmsClientProviderGetKeyArgs): Promise<GetKeyResponse>
  kmsClientProviderDeleteKey(args: KmsClientProviderDeleteKeyArgs): Promise<boolean>
}

export type BaseArgs = {
  baseUrl?: string
  tenantId?: string
  userId?: string
}

export type OptionalProviderContextArgs = BaseArgs & {
  providerId?: string
}

export type ProviderContextArgs = BaseArgs & {
  providerId: string
}

export type KmsClientListResolversArgs = BaseArgs

export type KmsClientGetResolverArgs = BaseArgs & {
  resolverId: string
}

export type KmsClientResolveKeyArgs = BaseArgs & {
  resolverId: String
} & ResolvePublicKey

export type KmsClientCreateRawSignatureArgs = BaseArgs & CreateRawSignature

export type KmsClientIsValidRawSignatureArgs = BaseArgs & VerifyRawSignature

export type KmsClientGetKeyArgs = BaseArgs &
  OptionalProviderContextArgs & {
    aliasOrKid: string
  }

export type KmsClientListKeysArgs = BaseArgs & OptionalProviderContextArgs

export type KmsClientStoreKeyArgs = BaseArgs & StoreKey

export type KmsClientGenerateKeyArgs = BaseArgs & OptionalProviderContextArgs & GenerateKeyGlobal

export type KmsClientDeleteKeyArgs = BaseArgs &
  OptionalProviderContextArgs & {
    aliasOrKid: string
  }

export type KmsClientGetKeyProviderArgs = BaseArgs & ProviderContextArgs

export type KmsClientListKeyProvidersArgs = BaseArgs

export type KmsClientProviderListKeysArgs = BaseArgs & ProviderContextArgs

export type KmsClientProviderStoreKeyArgs = BaseArgs & ProviderContextArgs & StoreKey

export type KmsClientProviderGenerateKeyArgs = BaseArgs & ProviderContextArgs & GenerateKey

export type KmsClientProviderGetKeyArgs = BaseArgs &
  ProviderContextArgs & {
    aliasOrKid: string
  }

export type KmsClientProviderDeleteKeyArgs = BaseArgs &
  ProviderContextArgs & {
    aliasOrKid: string
  }

export type RestClientAuthenticationOpts = {
  enabled?: boolean
  bearerToken?: BearerTokenArg
}

export type KmsRestClientArgs = {
  baseUrl?: string
  authentication?: RestClientAuthenticationOpts
}

export type IRequiredContext = IAgentContext<never>
