import { IKey, ManagedKeyInfo, MinimalImportableKey, TKeyType } from '@veramo/core'
import { AbstractKeyManagementSystem } from '@veramo/key-manager'
import { KeyMetadata } from './index'
import * as AzureRestClient from './js-client'
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a

import { JsonWebKey } from '@sphereon/ssi-types'

interface AbstractKeyManagementSystemOptions {
  applicationId: string
  vaultUrl: string
  apiKey: string
}

export class AzureKeyVaultKeyManagementSystemRestClient extends AbstractKeyManagementSystem {
  private client: AzureRestClient.KeyVaultControllerApi
  private readonly id: string

  constructor(options: AbstractKeyManagementSystemOptions) {
    super()

    const config = AzureRestClient.createConfiguration({
      baseServer: new AzureRestClient.ServerConfiguration(options.vaultUrl, {}),
      authMethods: {
        apiKeyScheme: options.apiKey,
      },
    })

    this.id = options.applicationId
    this.client = new AzureRestClient.KeyVaultControllerApi(config)
  }

  async createKey(args: { type: TKeyType; meta?: KeyMetadata }): Promise<ManagedKeyInfo> {
    const { type, meta } = args

    const curveName = this.mapKeyTypeCurveName(type)

    const options: AzureRestClient.CreateEcKeyRequest = {
      keyName: meta?.keyAlias.replace(/_/g, '-'),
      curveName,
      operations: meta && 'keyOperations' in meta ? meta.keyOperations : ['sign', 'verify'],
    }

    const createKeyResponse = await this.client.createEcKey(options)

    return {
      kid: createKeyResponse.name!,
      kms: this.id,
      type,
      meta: {
        alias: createKeyResponse.name!,
        algorithms: [createKeyResponse.key?.curveName ?? 'ES256'],
        kmsKeyRef: createKeyResponse.id!,
      },
      publicKeyHex: this.ecJwkToRawHexKey(createKeyResponse.key as JsonWebKey),
    }
  }

  private ecJwkToRawHexKey(jwk: JsonWebKey): string {
    if (!jwk.x || !jwk.y) {
      throw new Error("EC JWK must contain 'x' and 'y' properties.")
    }

    // We are converting from base64 to base64url to be sure. The spec uses base64url, but in the wild we sometimes encounter a base64 string
    const x = fromString(jwk.x.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')
    const y = fromString(jwk.y.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), 'base64url')

    return '04' + toString(x, 'hex') + toString(y, 'hex')
  }

  private mapKeyTypeCurveName = (type: TKeyType) => {
    switch (type) {
      case 'Secp256r1':
        return 'P-256'
      default:
        throw new Error(`Key type ${type} is not supported by AzureKeyVaultKMS`)
    }
  }

  keyTypeToDigestAlgorithm = (type: TKeyType): 'sha256' | 'sha512' => {
    switch (type) {
      case 'Secp256r1':
        return 'sha256'
      default:
        throw new Error(`Key type ${type} is not supported by AzureKeyVaultKMS`)
    }
  }

  async sign(args: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array; [x: string]: any }): Promise<string> {
    if (!args.keyRef) {
      throw new Error('key_not_found: No key ref provided')
    }
    const signResponse = await this.client.signPayload({
      keyName: args.keyRef.kid,
      payload: toString(args.data),
    })
    return signResponse.signature
  }

  async verify(args: { keyRef: Pick<IKey, 'kid'>; data: Uint8Array; signature: string; [x: string]: any }): Promise<Boolean> {
    if (!args.keyRef) {
      throw new Error('key_not_found: No key ref provided')
    }

    return await this.client.verifyPayload({
      keyName: args.keyRef.kid,
      signature: args.signature,
      payload: new TextDecoder().decode(args.data),
    })
  }

  sharedSecret(args: { myKeyRef: Pick<IKey, 'kid'>; theirKey: Pick<IKey, 'publicKeyHex' | 'type'> }): Promise<string> {
    throw new Error('sharedSecret is not implemented for AzureKeyVaultKMS.')
  }

  async importKey(args: Omit<MinimalImportableKey, 'kms'> & { privateKeyPEM?: string }): Promise<ManagedKeyInfo> {
    throw new Error('importKey is not implemented for AzureKeyVaultKMS.')
  }

  async deleteKey({ kid }: { kid: string }): Promise<boolean> {
    throw new Error('deleteKey is not implemented for AzureKeyVaultKMS.')
  }

  async listKeys(): Promise<ManagedKeyInfo[]> {
    throw new Error('listKeys is not implemented for AzureKeyVaultKMS.')
  }
}
