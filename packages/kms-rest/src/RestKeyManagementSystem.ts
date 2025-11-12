import { calculateJwkThumbprint, toJwk, x25519PublicHexFromPrivateHex, type X509Opts } from '@sphereon/ssi-sdk-ext.key-utils'
import { hexToPEM, jwkToPEM, pemCertChainTox5c, PEMToHex, PEMToJwk } from '@sphereon/ssi-sdk-ext.x509-utils'
import type { ManagedKeyInfo as RestManagedKeyInfo } from '@sphereon/ssi-sdk.kms-rest-client'
import {
  CurveFromJSONTyped,
  JwkKeyTypeFromJSONTyped,
  JwkUse,
  JwkUseFromJSONTyped,
  KeyOperations,
  KmsRestClient,
  ListKeysResponseToJSONTyped,
  type RestClientAuthenticationOpts,
  SignatureAlgorithm,
  type StoreKey,
} from '@sphereon/ssi-sdk.kms-rest-client'
import { JoseSignatureAlgorithm, type JWK } from '@sphereon/ssi-types'
import type { ManagedKeyInfo, TKeyType } from '@veramo/core'
import { AbstractKeyManagementSystem } from '@veramo/key-manager'
import elliptic from 'elliptic'
// @ts-ignore
import * as u8a from 'uint8arrays'
import type { CreateKeyArgs, DeleteKeyArgs, ImportKeyArgs, MapImportKeyArgs, MappedImportKey, SharedSecretArgs, SignArgs, VerifyArgs } from './types'

const { fromString, toString } = u8a

interface KeyManagementSystemOptions {
  applicationId: string
  baseUrl: string
  providerId?: string
  authOpts?: RestClientAuthenticationOpts
}

export class RestKeyManagementSystem extends AbstractKeyManagementSystem {
  private client: KmsRestClient
  private readonly id: string
  private providerId: string | undefined

  constructor(options: KeyManagementSystemOptions) {
    super()

    const config = {
      baseUrl: options.baseUrl,
      authOpts: options.authOpts,
    }

    this.id = options.applicationId
    this.providerId = options.providerId
    this.client = new KmsRestClient(config)
  }

  async createKey(args: CreateKeyArgs): Promise<ManagedKeyInfo> {
    const { type, meta } = args

    const signatureAlgorithm = this.mapKeyTypeToSignatureAlgorithm(type)
    const options = {
      use: meta && 'keyUsage' in meta ? this.mapKeyUsage(meta.keyUsage) : JwkUse.Sig,
      alg: signatureAlgorithm,
      keyOperations: meta ? this.mapKeyOperations(meta.keyOperations as string[]) : [KeyOperations.Sign],
    }

    const key = this.providerId
      ? await this.client.methods.kmsClientProviderGenerateKey({
          ...options,
          providerId: this.providerId,
        })
      : await this.client.methods.kmsClientGenerateKey(options)

    const jwk = {
      ...key.keyPair.jose.publicJwk,
      alg: key.keyPair.jose.publicJwk.alg ? this.mapJoseAlgorithm(key.keyPair.jose.publicJwk.alg) : undefined,
    } satisfies JWK

    const kid = key.keyPair.kid ?? key.keyPair.jose.publicJwk.kid
    if (!kid) {
      throw new Error(`No kid present in key`)
    }

    return {
      kid,
      kms: this.id,
      type,
      meta: {
        alias: key.keyPair.alias,
        algorithms: [key.keyPair.jose.publicJwk.alg ?? 'PS256'],
        jwkThumbprint: calculateJwkThumbprint({
          jwk,
          digestAlgorithm: this.signatureAlgorithmToDigestAlgorithm(signatureAlgorithm),
        }),
      },
      publicKeyHex: Buffer.from(key.keyPair.jose.publicJwk.toString(), 'utf8').toString('base64'),
    }
  }

  async importKey(args: ImportKeyArgs): Promise<ManagedKeyInfo> {
    const { type } = args
    const signatureAlgorithm = this.mapKeyTypeToSignatureAlgorithm(type)
    const importKey = this.mapImportKey(args)

    const result = this.providerId
      ? await this.client.methods.kmsClientProviderStoreKey({
          ...importKey.key,
          providerId: this.providerId,
        })
      : await this.client.methods.kmsClientStoreKey(importKey.key)

    return {
      kid: importKey.kid,
      kms: this.id,
      type,
      meta: {
        alias: importKey.key.keyInfo.alias,
        algorithms: [result.keyInfo.key.alg ?? 'PS256'],
        jwkThumbprint: calculateJwkThumbprint({
          jwk: importKey.publicKeyJwk,
          digestAlgorithm: this.signatureAlgorithmToDigestAlgorithm(signatureAlgorithm),
        }),
      },
      publicKeyHex: Buffer.from(result.keyInfo.key.toString(), 'utf8').toString('base64'),
    }
  }

  async deleteKey(args: DeleteKeyArgs): Promise<boolean> {
    const { kid } = args

    return this.providerId
      ? await this.client.methods.kmsClientProviderDeleteKey({
          aliasOrKid: kid,
          providerId: this.providerId,
        })
      : await this.client.methods.kmsClientDeleteKey({ aliasOrKid: kid })
  }

  async listKeys(): Promise<ManagedKeyInfo[]> {
    const keys = this.providerId
      ? await this.client.methods.kmsClientProviderListKeys({ providerId: this.providerId })
      : await this.client.methods.kmsClientListKeys()

    const restKeys = ListKeysResponseToJSONTyped(keys, false).keyInfos

    return restKeys.map((restKey: RestManagedKeyInfo) => {
      const jwk = restKey.key
      let publicKeyHex = ''

      // Derive publicKeyHex from JWK based on key type
      if (jwk.kty === 'EC') {
        publicKeyHex = jwk.x || ''
      } else if (jwk.kty === 'RSA') {
        publicKeyHex = jwk.n || ''
      } else if (jwk.kty === 'OKP') {
        publicKeyHex = jwk.x || ''
      }

      const keyType = this.mapRestKeyTypeToTKeyType(restKey.keyType)

      return {
        kid: restKey.kid || restKey.alias,
        kms: this.id,
        type: keyType,
        publicKeyHex,
        meta: {
          algorithms: restKey.signatureAlgorithm ? [restKey.signatureAlgorithm] : undefined,
          jwk,
          jwkThumbprint: calculateJwkThumbprint({
            jwk: jwk as JWK,
            digestAlgorithm: restKey.signatureAlgorithm ? this.signatureAlgorithmToDigestAlgorithm(restKey.signatureAlgorithm) : 'sha256',
          }),
          alias: restKey.alias,
          providerId: restKey.providerId,
          x5c: restKey.x5c,
          keyVisibility: restKey.keyVisibility,
          keyEncoding: restKey.keyEncoding,
          ...restKey.opts,
        },
      } satisfies ManagedKeyInfo
    })
  }

  private mapRestKeyTypeToTKeyType(keyType: string | undefined): TKeyType {
    switch (keyType) {
      case 'RSA':
        return 'RSA'
      case 'EC':
      case 'P256':
        return 'Secp256r1'
      case 'X25519':
        return 'X25519'
      case 'Ed25519':
        return 'Ed25519'
      case 'secp256k1':
        return 'Secp256k1'
      default:
        throw new Error(`Unknown key type: ${keyType}`)
    }
  }

  async sign(args: SignArgs): Promise<string> {
    const { keyRef, data } = args
    const key = this.providerId
      ? await this.client.methods.kmsClientProviderGetKey({
          aliasOrKid: keyRef.kid,
          providerId: this.providerId,
        })
      : await this.client.methods.kmsClientGetKey({ aliasOrKid: keyRef.kid })

    const signingResult = await this.client.methods.kmsClientCreateRawSignature({
      keyInfo: key.keyInfo,
      input: toString(data, 'base64'),
    })

    return signingResult.signature
  }

  async verify(args: VerifyArgs): Promise<boolean> {
    const { keyRef, data, signature } = args
    const key = this.providerId
      ? await this.client.methods.kmsClientProviderGetKey({
          aliasOrKid: keyRef.kid,
          providerId: this.providerId,
        })
      : await this.client.methods.kmsClientGetKey({ aliasOrKid: keyRef.kid })

    const verification = await this.client.methods.kmsClientIsValidRawSignature({
      keyInfo: key.keyInfo,
      input: toString(data, 'base64'),
      signature,
    })

    return verification.isValid
  }

  async sharedSecret(args: SharedSecretArgs): Promise<string> {
    throw new Error('sharedSecret is not implemented for REST KMS.')
  }

  private signatureAlgorithmToDigestAlgorithm = (signatureAlgorithm: SignatureAlgorithm): 'sha256' | 'sha512' => {
    switch (signatureAlgorithm) {
      case SignatureAlgorithm.EcdsaSha256:
      case SignatureAlgorithm.RsaSsaPssSha256Mgf1:
      case SignatureAlgorithm.EckaDhSha256:
      case SignatureAlgorithm.HmacSha256:
      case SignatureAlgorithm.Es256K:
        return 'sha256'
      case SignatureAlgorithm.EcdsaSha512:
      case SignatureAlgorithm.HmacSha512:
      case SignatureAlgorithm.RsaSsaPssSha512Mgf1:
        return 'sha512'
      default:
        throw new Error(`Signature algorithm ${signatureAlgorithm} is not supported by REST KMS`)
    }
  }

  private mapKeyUsage = (usage: string): JwkUse => {
    switch (usage) {
      case 'sig':
        return JwkUse.Sig
      case 'enc':
        return JwkUse.Enc
      default:
        throw new Error(`Key usage ${usage} is not supported by REST KMS`)
    }
  }

  private mapKeyTypeToSignatureAlgorithm = (type: TKeyType): SignatureAlgorithm => {
    switch (type) {
      case 'Secp256r1':
        return SignatureAlgorithm.EcdsaSha256
      case 'RSA':
        return SignatureAlgorithm.RsaSsaPssSha256Mgf1
      case 'X25519':
        return SignatureAlgorithm.EckaDhSha256
      default:
        throw new Error(`Key type ${type} is not supported by REST KMS`)
    }
  }

  private mapJoseAlgorithm = (alg: string): JoseSignatureAlgorithm => {
    switch (alg) {
      case 'RS256':
        return JoseSignatureAlgorithm.RS256
      case 'RS384':
        return JoseSignatureAlgorithm.RS384
      case 'RS512':
        return JoseSignatureAlgorithm.RS512
      case 'ES256':
        return JoseSignatureAlgorithm.ES256
      case 'ES256K':
        return JoseSignatureAlgorithm.ES256K
      case 'ES384':
        return JoseSignatureAlgorithm.ES384
      case 'ES512':
        return JoseSignatureAlgorithm.ES512
      case 'EdDSA':
        return JoseSignatureAlgorithm.EdDSA
      case 'HS256':
        return JoseSignatureAlgorithm.HS256
      case 'HS384':
        return JoseSignatureAlgorithm.HS384
      case 'HS512':
        return JoseSignatureAlgorithm.HS512
      case 'PS256':
        return JoseSignatureAlgorithm.PS256
      case 'PS384':
        return JoseSignatureAlgorithm.PS384
      case 'PS512':
        return JoseSignatureAlgorithm.PS512
      case 'none':
        return JoseSignatureAlgorithm.none
      default:
        throw new Error(`Signature algorithm ${alg} is not supported by REST KMS`)
    }
  }

  private mapKeyOperation = (operation: string): KeyOperations => {
    switch (operation) {
      case 'sign':
        return KeyOperations.Sign
      case 'verify':
        return KeyOperations.Verify
      case 'wrapKey':
        return KeyOperations.WrapKey
      case 'deriveKey':
        return KeyOperations.DeriveKey
      case 'unwrapKey':
        return KeyOperations.UnwrapKey
      case 'decrypt':
        return KeyOperations.Decrypt
      case 'deriveBits':
        return KeyOperations.DeriveBits
      case 'encrypt':
        return KeyOperations.Encrypt
      default:
        throw new Error(`Key operation ${operation} is not supported by REST KMS`)
    }
  }

  private mapKeyOperations = (operations: string[]): KeyOperations[] => {
    return operations.map((operation) => this.mapKeyOperation(operation))
  }

  private mapImportRsaKey = (args: MapImportKeyArgs): MappedImportKey => {
    const x509 = args.meta?.x509 as X509Opts
    const privateKeyPEM = x509?.privateKeyPEM ?? (args.privateKeyHex.includes('---') ? args.privateKeyHex : hexToPEM(args.privateKeyHex, 'private')) // In case we have x509 opts, the private key hex really was a PEM already (yuck)
    const publicKeyJwk = PEMToJwk(privateKeyPEM, 'public')
    const privateKeyJwk = PEMToJwk(privateKeyPEM)
    const publicKeyPEM = jwkToPEM(publicKeyJwk, 'public')
    const publicKeyHex = PEMToHex(publicKeyPEM)

    const meta = {} as any
    if (x509) {
      meta.x509 = {
        cn: x509.cn ?? args.kid ?? publicKeyHex,
      }
      let certChain: string = x509.certificateChainPEM ?? ''
      if (x509.certificatePEM) {
        if (!certChain.includes(x509.certificatePEM)) {
          certChain = `${x509.certificatePEM}\n${certChain}`
        }
      }
      if (certChain.length > 0) {
        meta.x509.certificateChainPEM = certChain
        const x5c = pemCertChainTox5c(certChain)
        if (!x509.certificateChainURL) {
          // Do not put the chain in the JWK when the chain is hosted. We do put it in the x509 metadata
          // @ts-ignore
          publicKeyJwk.x5c = x5c
        }
        meta.x509.x5c = x5c
      }
      if (x509.certificateChainURL) {
        // @ts-ignore
        publicKeyJwk.x5u = x509.certificateChainURL
        meta.x509.x5u = x509.certificateChainURL
      }
    }

    const kid = args.kid ?? meta?.x509?.cn ?? publicKeyHex
    return {
      kid,
      publicKeyJwk: publicKeyJwk as JWK,
      key: {
        keyInfo: {
          key: {
            ...privateKeyJwk,
            kid,
            kty: JwkKeyTypeFromJSONTyped(privateKeyJwk.kty, false),
            use: JwkUseFromJSONTyped(privateKeyJwk.use, false),
            crv: CurveFromJSONTyped(privateKeyJwk.crv, false),
          },
        },
        certChain: meta.x509.x5c,
      } satisfies StoreKey,
    }
  }

  private mapImportSecp256r1Key = (args: MapImportKeyArgs): MappedImportKey => {
    const { privateKeyHex } = args
    const privateBytes = fromString(privateKeyHex.toLowerCase(), 'base16')
    const secp256r1 = new elliptic.ec('p256')
    const keyPair = secp256r1.keyFromPrivate(privateBytes, 'hex')
    const publicKeyHex = keyPair.getPublic(true, 'hex')
    const publicKeyJwk = toJwk(publicKeyHex, 'Secp256r1')
    const privateKeyJwk = toJwk(privateKeyHex, 'Secp256r1', { isPrivateKey: true })
    const kid = args.kid ?? publicKeyJwk.kid ?? publicKeyHex

    return {
      kid,
      publicKeyJwk: publicKeyJwk as JWK,
      key: {
        keyInfo: {
          key: {
            ...privateKeyJwk,
            kid,
            kty: JwkKeyTypeFromJSONTyped(privateKeyJwk.kty, false),
            use: JwkUseFromJSONTyped(privateKeyJwk.use, false),
            crv: CurveFromJSONTyped(privateKeyJwk.crv, false),
          },
        },
      } satisfies StoreKey,
    }
  }

  private mapImportX25519Key = (args: MapImportKeyArgs): MappedImportKey => {
    const { privateKeyHex } = args
    const privateKeyJwk = toJwk(privateKeyHex, 'X25519', { isPrivateKey: true })
    const publicKeyHex = x25519PublicHexFromPrivateHex(privateKeyHex)
    const publicKeyJwk = toJwk(publicKeyHex, 'X25519')
    const kid = args.kid ?? publicKeyJwk.kid ?? publicKeyHex

    return {
      kid,
      publicKeyJwk: publicKeyJwk as JWK,
      key: {
        keyInfo: {
          key: {
            ...privateKeyJwk,
            kid,
            kty: JwkKeyTypeFromJSONTyped(privateKeyJwk.kty, false),
            use: JwkUseFromJSONTyped(privateKeyJwk.use, false),
            crv: CurveFromJSONTyped(privateKeyJwk.crv, false),
          },
        },
      } satisfies StoreKey,
    }
  }

  private mapImportKey = (args: MapImportKeyArgs): MappedImportKey => {
    switch (args.type) {
      case 'RSA': {
        return this.mapImportRsaKey(args)
      }
      case 'Secp256r1': {
        return this.mapImportSecp256r1Key(args)
      }
      case 'X25519': {
        return this.mapImportX25519Key(args)
      }
      default:
        throw new Error(`Key type ${args.type} is not supported by REST KMS`)
    }
  }
}
