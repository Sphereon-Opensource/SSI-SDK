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
  VerifyRawSignatureResponse
} from '../models'

export interface IKmsRestClient extends IPluginMethodMap {
  kmsGetResolver(args: kmsGetResolverArgs): Promise<Resolver>
  kmsListResolvers(args: KmsListResolversArgs): Promise<ListResolversResponse>
  kmsResolveKey(args: KmsResolveKeyArgs): Promise<ResolvedKeyInfo>
  kmsCreateRawSignature(args: KmsCreateRawSignatureArgs): Promise<CreateRawSignatureResponse>
  kmsIsValidRawSignature(args: KmsIsValidRawSignatureArgs): Promise<VerifyRawSignatureResponse>
  kmsGetKey(args: KmsGetKeyArgs): Promise<ManagedKeyInfo>
  kmsListKeys(args: KmsListKeysArgs): Promise<ListKeysResponse>
  kmsStoreKey(args: KmsStoreKeyArgs): Promise<ManagedKeyInfo>
  kmsGenerateKey(args: KmsGenerateKeyArgs): Promise<ManagedKeyPair>
  kmsDeleteKey(args: KmsDeleteKeyArgs): Promise<boolean>
  kmsGetKeyProvider(args: KmsGetKeyProviderArgs): Promise<KeyProviderResponse>
  kmsListKeyProviders(args: KmsListKeyProvidersArgs): Promise<ListKeyProvidersResponse>
  kmsProviderListKeys(args: KmsProviderListKeysArgs): Promise<ListKeysResponse>
  kmsProviderStoreKey(args: KmsProviderStoreKey): Promise<ManagedKeyInfo>
  kmsProviderGenerateKey(args: KmsProviderGenerateKey): Promise<ManagedKeyPair>
  kmsProviderGetKey(args: KmsProviderGetKeyArgs): Promise<ManagedKeyInfo>
  kmsProviderDeleteKey(args: KmsProviderDeleteKeyArgs): Promise<boolean>
}

export type KmsListResolversArgs = {
  baseUrl?: string
}

export type kmsGetResolverArgs = {
  baseUrl?: string
  resolverId: string
}

export type KmsResolveKeyArgs = {
  baseUrl?: string
  resolverId: String
} & ResolvePublicKey

export type KmsCreateRawSignatureArgs = {
  baseUrl?: string
} & CreateRawSignature

export type KmsIsValidRawSignatureArgs = {
  baseUrl?: string
} & VerifyRawSignature

export type KmsGetKeyArgs = {
  baseUrl?: string
  aliasOrKid: string
}

export type KmsListKeysArgs = {
  baseUrl?: string
  providerId?: string
}

export type KmsStoreKeyArgs = {
  baseUrl?: string
} & StoreKey

export type KmsGenerateKeyArgs = {
  baseUrl?: string
} & GenerateKeyGlobal

export type KmsDeleteKeyArgs = {
  baseUrl?: string
  aliasOrKid?: string
}

export type KmsGetKeyProviderArgs = {
  baseUrl?: string
  providerId?: string
}

export type KmsListKeyProvidersArgs = {
  baseUrl?: string
}

export type KmsProviderListKeysArgs = {
  baseUrl?: string
  providerId: string
}

export type KmsProviderStoreKey = {
  baseUrl?: string
  providerId: string
} & StoreKey

export type KmsProviderGenerateKey = {
  baseUrl?: string
  providerId: string
} & GenerateKey

export type KmsProviderGetKeyArgs = {
  baseUrl?: string
  providerId: string
  aliasOrKid: string
}

export type KmsProviderDeleteKeyArgs = {
  baseUrl?: string
  providerId: string
  aliasOrKid: string
}

export type RestClientAuthenticationOpts = {
  enabled?: boolean
  bearerToken?: BearerTokenArg
}

export type KmsRestClientArgs = {
  baseUrl?: string,
  authentication?: RestClientAuthenticationOpts
}

export type IRequiredContext = IAgentContext<never>
