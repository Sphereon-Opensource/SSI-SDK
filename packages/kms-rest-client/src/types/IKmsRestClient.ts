import { IAgentContext, IPluginMethodMap } from '@veramo/core'
import type { BearerTokenArg } from '@sphereon/ssi-types'
import {
  CreateRawSignature,
  CreateRawSignatureResponse,
  GenerateKey,
  GenerateKeyGlobal,
  KeyProviderResponse,
  ListKeyProvidersResponse,
  ListKeysResponse,
  ListResolversResponse,
  ManagedKeyInfo,
  ManagedKeyPair,
  ResolvedKeyInfo,
  ResolvePublicKey,
  Resolver,
  StoreKey,
  VerifyRawSignature,
  VerifyRawSignatureResponse,
} from '../models'

export interface IKmsRestClient extends IPluginMethodMap {
  kmsClientGetResolver(args: kmsClientGetResolverArgs): Promise<Resolver>
  kmsClientListResolvers(args: KmsClientListResolversArgs): Promise<ListResolversResponse>
  kmsClientResolveKey(args: KmsClientResolveKeyArgs): Promise<ResolvedKeyInfo>
  kmsClientCreateRawSignature(args: KmsClientCreateRawSignatureArgs): Promise<CreateRawSignatureResponse>
  kmsClientIsValidRawSignature(args: KmsClientIsValidRawSignatureArgs): Promise<VerifyRawSignatureResponse>
  kmsClientGetKey(args: KmsClientGetKeyArgs): Promise<ManagedKeyInfo>
  kmsClientListKeys(args: KmsClientListKeysArgs): Promise<ListKeysResponse>
  kmsClientStoreKey(args: KmsClientStoreKeyArgs): Promise<ManagedKeyInfo>
  kmsClientGenerateKey(args: KmsClientGenerateKeyArgs): Promise<ManagedKeyPair>
  kmsClientDeleteKey(args: KmsClientDeleteKeyArgs): Promise<boolean>
  kmsClientGetKeyProvider(args: KmsClientGetKeyProviderArgs): Promise<KeyProviderResponse>
  kmsClientListKeyProviders(args: KmsClientListKeyProvidersArgs): Promise<ListKeyProvidersResponse>
  kmsClientProviderListKeys(args: KmsClientProviderListKeysArgs): Promise<ListKeysResponse>
  kmsClientProviderStoreKey(args: KmsClientProviderStoreKey): Promise<ManagedKeyInfo>
  kmsClientProviderGenerateKey(args: KmsClientProviderGenerateKey): Promise<ManagedKeyPair>
  kmsClientProviderGetKey(args: KmsClientProviderGetKeyArgs): Promise<ManagedKeyInfo>
  kmsClientProviderDeleteKey(args: KmsClientProviderDeleteKeyArgs): Promise<boolean>
}

export type KmsClientListResolversArgs = {
  baseUrl?: string
}

export type kmsClientGetResolverArgs = {
  baseUrl?: string
  resolverId: string
}

export type KmsClientResolveKeyArgs = {
  baseUrl?: string
  resolverId: String
} & ResolvePublicKey

export type KmsClientCreateRawSignatureArgs = {
  baseUrl?: string
} & CreateRawSignature

export type KmsClientIsValidRawSignatureArgs = {
  baseUrl?: string
} & VerifyRawSignature

export type KmsClientGetKeyArgs = {
  baseUrl?: string
  aliasOrKid: string
}

export type KmsClientListKeysArgs = {
  baseUrl?: string
  providerId?: string
}

export type KmsClientStoreKeyArgs = {
  baseUrl?: string
} & StoreKey

export type KmsClientGenerateKeyArgs = {
  baseUrl?: string
} & GenerateKeyGlobal

export type KmsClientDeleteKeyArgs = {
  baseUrl?: string
  aliasOrKid?: string
}

export type KmsClientGetKeyProviderArgs = {
  baseUrl?: string
  providerId?: string
}

export type KmsClientListKeyProvidersArgs = {
  baseUrl?: string
}

export type KmsClientProviderListKeysArgs = {
  baseUrl?: string
  providerId: string
}

export type KmsClientProviderStoreKey = {
  baseUrl?: string
  providerId: string
} & StoreKey

export type KmsClientProviderGenerateKey = {
  baseUrl?: string
  providerId: string
} & GenerateKey

export type KmsClientProviderGetKeyArgs = {
  baseUrl?: string
  providerId: string
  aliasOrKid: string
}

export type KmsClientProviderDeleteKeyArgs = {
  baseUrl?: string
  providerId: string
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
