import { randomBytes } from '@ethersproject/random'
import { getControllerKey, getKeys } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, calculateJwkThumbprintForKey, JwkKeyUse, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { IAgentContext, IKey, IKeyManager, MinimalImportableKey } from '@veramo/core'
import { getBytes, SigningKey, Transaction } from 'ethers'
import { base58btc } from 'multiformats/bases/base58'
import * as u8a from 'uint8arrays'
import { getBaseUrl } from '../functions'
import { ApiOpts, EbsiApiVersion, EbsiEnvironment, WellknownOpts } from '../types/IEbsiSupport'
import { callRpcMethod } from './services/EbsiRPCService'
import {
  BASE_CONTEXT_DOC,
  CreateEbsiDidParams,
  EBSI_DID_SPEC_INFOS,
  EbsiDidRegistryAPIEndpoints,
  EbsiDidSpecInfo,
  EbsiKeyType,
  EbsiPublicKeyPurpose,
  EbsiRpcMethod,
  EbsiRPCResponse,
  IContext,
  IKeyOpts,
  Response200,
} from './types'

export function generateEbsiMethodSpecificId(specInfo?: EbsiDidSpecInfo): string {
  const spec = specInfo ?? EBSI_DID_SPEC_INFOS.V1
  const length = spec.didLength ?? 16

  const result = new Uint8Array(length + (spec.version ? 1 : 0))
  if (spec.version) {
    result.set([spec.version])
  }
  result.set(randomBytes(length), spec.version ? 1 : 0)
  return base58btc.encode(result)
}

export function generateOrUseProvidedEbsiPrivateKeyHex(specInfo?: EbsiDidSpecInfo, privateKeyBytes?: Uint8Array): string {
  const spec = specInfo ?? EBSI_DID_SPEC_INFOS.V1
  const length = spec.didLength ? 2 * spec.didLength : 32

  if (privateKeyBytes) {
    if (privateKeyBytes.length !== length) {
      throw Error(`Invalid private key length supplied (${privateKeyBytes.length}. Expected ${length} for ${spec.type}`)
    }
    return u8a.toString(privateKeyBytes, 'base16')
  }
  return u8a.toString(randomBytes(length), 'base16')
}

/**
 * Returns the public key in the correct format to be used with the did registry v5
 * - in case of Secp256k1 - returns the uncompressed public key as hex string prefixed with 0x04
 * - in case of Secp256r1 - returns the jwk public key as hex string
 * @param {{ key: IKey, type: EbsiKeyType }} args
 *  - key is the cryptographic key containing the public key
 *  - type is the type of the key which can be Secp256k1 or Secp256r1
 *  @returns {string} The properly formatted public key
 *  @throws {Error} If the key type is invalid
 */
export const formatEbsiPublicKey = (args: { key: IKey; type: EbsiKeyType }): string => {
  const { key, type } = args
  switch (type) {
    case 'Secp256k1': {
      const bytes = getBytes('0x' + key.publicKeyHex, 'key')
      return SigningKey.computePublicKey(bytes, false)
    }
    case 'Secp256r1': {
      /*
                                Public key as hex string. For an ES256K key, it must be in uncompressed format prefixed with "0x04".
                                For other algorithms, it must be the JWK transformed to string and then to hex format.
                               */
      const jwk: JsonWebKey = toJwk(key.publicKeyHex, type, { use: JwkKeyUse.Signature, key })
      /*
                                Converting JWK to string and then hex is odd and may lead to errors. Implementing
                                it like that because it's how EBSI does it. However, it may be a point of pain
                                in the future.
                               */
      const jwkString = JSON.stringify(jwk, null, 2)
      return u8a.toString(u8a.fromString(jwkString), 'base16')
    }
    default:
      throw new Error(`Invalid key type: ${type}`)
  }
}

export const ebsiGetIssuerMock = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): string => {
  const { environment = 'pilot', version = 'v4' } = args
  return `${getBaseUrl({ environment, version, system: environment })}/issuer-mock`
}

export const ebsiGetAuthorisationServer = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): string => {
  const { environment = 'pilot', version = 'v4' } = args
  return `${getBaseUrl({ environment, version, system: 'authorisation' })}`
}

export const ebsiGetRegistryAPIUrls = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): EbsiDidRegistryAPIEndpoints => {
  const { environment = 'pilot', version = 'v5' } = args
  const baseUrl = `${getBaseUrl({ environment, version, system: 'did-registry' })}`
  return {
    mutate: `${baseUrl}/jsonrpc`,
    query: `${baseUrl}/identifiers`,
  }
}

export const determineWellknownEndpoint = ({ environment, version, type, system = environment, mock }: WellknownOpts): string => {
  const url = `${getBaseUrl({ environment, version, system })}${mock? `/${mock}` : ''}/.well-known/${type}`
  console.log(`wellknown url: ${url}`)
  return url
}

export const ebsiSignAndSendTransaction = async (
  args: {
    rpcResponse: EbsiRPCResponse
    kid: string
    bearerToken: string
    apiOpts?: ApiOpts
  },
  context: IContext,
) => {
  const { rpcResponse, bearerToken, kid, apiOpts } = args
  if ('status' in rpcResponse) {
    throw new Error(JSON.stringify(rpcResponse, null, 2))
  }
  const unsignedTransaction = (rpcResponse as Response200).result

  const signedRawTransaction = await context.agent.keyManagerSignEthTX({
    kid,
    transaction: unsignedTransaction,
  })

  const { r, s, v } = Transaction.from(signedRawTransaction).signature!

  const sTResponse = await callRpcMethod({
    params: [
      {
        protocol: 'eth',
        unsignedTransaction,
        r,
        s,
        v: v.toString(),
        signedRawTransaction,
      },
    ],
    rpcMethod: EbsiRpcMethod.SEND_SIGNED_TRANSACTION,
    rpcId: rpcResponse.id,
    apiOpts,
    bearerToken,
  })

  if ('status' in sTResponse) {
    throw new Error(JSON.stringify(sTResponse, null, 2))
  }
  return sTResponse
}

export const ebsiGenerateOrUseKeyPair = async (
  args: {
    keyOpts?: IKeyOpts
    keyType: EbsiKeyType
    kms: string
    controllerKey?: boolean
  },
  context: IAgentContext<IKeyManager>,
) => {
  const { keyOpts, keyType, kms, controllerKey = false } = args
  let privateKeyHex = generateOrUseProvidedEbsiPrivateKeyHex(
    EBSI_DID_SPEC_INFOS.V1,
    keyOpts?.privateKeyHex ? u8a.fromString(keyOpts.privateKeyHex, 'base16') : undefined,
  )
  if (privateKeyHex.startsWith('0x')) {
    privateKeyHex = privateKeyHex.substring(2)
  }
  if (!privateKeyHex || privateKeyHex.length !== 64) {
    throw new Error('Private key should be 32 bytes / 64 chars hex')
  }
  const importableKey = await toMinimalImportableKey({ key: { ...keyOpts, privateKeyHex }, type: keyType, kms })

  if (keyType === 'Secp256k1') {
    importableKey.meta = {
      ...importableKey.meta,
      ebsi: {
        anchored: false,
        controllerKey,
      },
    }
  }
  return importableKey
}

export const toMinimalImportableKey = async (args: { key?: IKeyOpts; type: EbsiKeyType; kms: string }): Promise<MinimalImportableKey> => {
  const { key, kms } = args
  const minimalImportableKey: Partial<MinimalImportableKey> = { ...key }
  const type = args.key?.type ?? args.type
  minimalImportableKey.kms = kms
  minimalImportableKey.type = type
  if (!minimalImportableKey.privateKeyHex) {
    throw Error(`Minimal importable key needs a private key`)
  }

  minimalImportableKey.meta = {
    purposes: assertedPurposes({ key }) ?? setDefaultPurposes({ key, type }),
    jwkThumbprint: calculateJwkThumbprintForKey({
      key: minimalImportableKey as MinimalImportableKey,
      digestAlgorithm: 'sha256',
    }),
  }
  return minimalImportableKey as MinimalImportableKey
}

export const assertedPurposes = (args: { key?: IKeyOpts }): EbsiPublicKeyPurpose[] | undefined => {
  const { key } = args
  if (key?.purposes && key.purposes.length > 0) {
    switch (key.type) {
      case 'Secp256k1': {
        if (key?.purposes && key.purposes.length > 0 && key.purposes?.includes(EbsiPublicKeyPurpose.CapabilityInvocation)) {
          return key.purposes
        }
        throw new Error(`Secp256k1/ES256K key requires ${EbsiPublicKeyPurpose.CapabilityInvocation} purpose`)
      }
      case 'Secp256r1': {
        if (
          key?.purposes &&
          key.purposes.length > 0 &&
          key.purposes.every((purpose) => [EbsiPublicKeyPurpose.AssertionMethod, EbsiPublicKeyPurpose.Authentication].includes(purpose))
        ) {
          return key.purposes
        }
        throw new Error(
          `Secp256r1/ES256 key requires ${[EbsiPublicKeyPurpose.AssertionMethod, EbsiPublicKeyPurpose.Authentication].join(', ')} purposes`,
        )
      }
      default:
        throw new Error(`Unsupported key type: ${key.type}`)
    }
  }
  return key?.purposes
}

export const setDefaultPurposes = (args: { key?: IKeyOpts; type: EbsiKeyType }): EbsiPublicKeyPurpose[] => {
  const { key, type } = args
  if (!key?.purposes || key.purposes.length === 0) {
    switch (type) {
      case 'Secp256k1':
        return [EbsiPublicKeyPurpose.CapabilityInvocation]
      case 'Secp256r1':
        return [EbsiPublicKeyPurpose.AssertionMethod, EbsiPublicKeyPurpose.Authentication]
      default:
        throw new Error(`Unsupported key type: ${key?.type}`)
    }
  }
  return key.purposes
}

export const randomRpcId = (): number => {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}

export const ebsiCreateDidOnLedger = async (args: CreateEbsiDidParams, context: IContext): Promise<void> => {
  const { apiOpts, notBefore, notAfter, baseDocument, identifier, bearerToken } = args
  const secp256k1 = getControllerKey({ identifier })
  const secp256r1 = getKeys({ identifier, keyType: 'Secp256r1' })?.[0]
  if (!secp256k1 || !secp256r1) {
    return Promise.reject(`No secp256k1 controller key and/or secp2561r key found for identifier ${identifier}`)
  }
  const from = secp256k1.meta?.ethereumAddress
  if (!from) {
    return Promise.reject(Error(`EBSI 'from' address expected for key ${secp256k1.publicKeyHex}`))
  }
  const rpcId = args.rpcId ?? randomRpcId()
  const insertDidDocResponse = await callRpcMethod({
    params: [
      {
        from,
        did: identifier.did,
        baseDocument: baseDocument ?? BASE_CONTEXT_DOC,
        vMethodId: calculateJwkThumbprint({ jwk: toJwk(secp256k1.publicKeyHex, 'Secp256k1') }),
        isSecp256k1: true,
        publicKey: formatEbsiPublicKey({ key: secp256k1, type: 'Secp256k1' }),
        notBefore,
        notAfter,
      },
    ],
    rpcMethod: EbsiRpcMethod.INSERT_DID_DOCUMENT,
    rpcId,
    apiOpts,
    bearerToken,
  })

  await ebsiSignAndSendTransaction(
    {
      rpcResponse: insertDidDocResponse,
      kid: secp256k1.kid,
      bearerToken,
      apiOpts,
    },
    context,
  )

  const addVerificationMethodResponse = await callRpcMethod({
    params: [
      {
        from,
        did: identifier.did,
        isSecp256k1: true,
        vMethodId: calculateJwkThumbprint({ jwk: toJwk(secp256k1.publicKeyHex, 'Secp256k1') }),
        publicKey: formatEbsiPublicKey({ key: secp256k1, type: 'Secp256k1' }),
      },
    ],
    rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_METHOD,
    rpcId,
    apiOpts,
    bearerToken,
  })

  await ebsiSignAndSendTransaction(
    {
      rpcResponse: addVerificationMethodResponse,
      kid: secp256k1.kid,
      bearerToken,
      apiOpts,
    },
    context,
  )

  const addVerificationMethodRelationshipResponse = await callRpcMethod({
    params: [
      {
        from,
        did: identifier.did,
        vMethodId: calculateJwkThumbprintForKey({ key: secp256r1 }),
        name: 'assertionMethod',
        notAfter: 1,
        notBefore: 1,
      },
    ],
    rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_METHOD_RELATIONSHIP,
    rpcId,
    apiOpts,
    bearerToken,
  })

  await ebsiSignAndSendTransaction(
    {
      rpcResponse: addVerificationMethodRelationshipResponse,
      kid: secp256k1.kid,
      bearerToken,
      apiOpts,
    },
    context,
  )
}
