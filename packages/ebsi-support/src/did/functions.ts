import { randomBytes } from '@ethersproject/random'
import { CreateRequestObjectMode } from '@sphereon/oid4vci-common'
import { getControllerKey, getEthereumAddressFromKey, getKeys } from '@sphereon/ssi-sdk-ext.did-utils'
import { calculateJwkThumbprint, calculateJwkThumbprintForKey, JwkKeyUse, toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { W3CVerifiableCredential } from '@sphereon/ssi-types'
import { IAgentContext, IKey, IKeyManager, MinimalImportableKey, TKeyType } from '@veramo/core'
import { getBytes, SigningKey, Transaction } from 'ethers'
import { base58btc } from 'multiformats/bases/base58'
import * as u8a from 'uint8arrays'
import { getEbsiApiBaseUrl, wait } from '../functions'
import { logger } from '../index'
import { ApiOpts, EbsiApiVersion, EbsiEnvironment, IRequiredContext, WellknownOpts } from '../types/IEbsiSupport'
import { ebsiWaitTillDocumentAnchored } from './services/EbsiRestService'
import { callRpcMethod } from './services/EbsiRPCService'
import {
  BASE_CONTEXT_DOC,
  CreateEbsiDidOnLedgerResult,
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
  RpcMethodArgs,
  RpcOkResponse,
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
export const formatEbsiPublicKey = (args: { key: IKey; type: TKeyType }): string => {
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
      return `0x${u8a.toString(u8a.fromString(jwkString), 'base16')}`
    }
    default:
      throw new Error(`Unsupported key type: ${type}`)
  }
}

export const ebsiGetIssuerMock = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): string => {
  const { environment = 'conformance', version = 'v3' } = args
  if (environment === 'pilot') {
    throw Error(`EBSI Pilot network does not have a issuer mock server`)
  }
  return `${getEbsiApiBaseUrl({ environment, version, system: environment })}/issuer-mock`
}

export const ebsiGetAuthorisationServer = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): string => {
  const { environment = 'pilot', version = 'v4' } = args
  return `${getEbsiApiBaseUrl({ environment, version, system: 'authorisation' })}`
}

export const ebsiGetRegistryAPIUrls = (args: { environment?: EbsiEnvironment; version?: EbsiApiVersion }): EbsiDidRegistryAPIEndpoints => {
  const { environment = 'pilot', version = 'v5' } = args
  const baseUrl = `${getEbsiApiBaseUrl({ environment, version, system: 'did-registry' })}`
  return {
    mutate: `${baseUrl}/jsonrpc`,
    query: `${baseUrl}/identifiers`,
  }
}

export const determineWellknownEndpoint = ({ environment, version, type, system = environment, mock }: WellknownOpts): string => {
  const url = `${getEbsiApiBaseUrl({ environment, version, system })}${mock ? `/${mock}` : ''}/.well-known/${type}`
  logger.debug(`wellknown url: ${url}`)
  return url
}

export const ebsiSignAndSendTransaction = async (
  args: {
    rpcRequest: RpcMethodArgs
    previousTxResponse?: EbsiRPCResponse
    kid: string
    accessToken: string
    apiOpts?: ApiOpts
  },
  context: IContext,
): Promise<EbsiRPCResponse> => {
  const { rpcRequest, accessToken, kid, apiOpts, previousTxResponse } = args
  const unsignedTxResponse = await callRpcMethod(rpcRequest)
  const nonce = 'result' in unsignedTxResponse ? unsignedTxResponse.result.nonce : undefined
  // We should get a new nonce once the actual previous transaction has been anchored. Thus we retry if the nonce remains the same
  if (
    previousTxResponse &&
    'result' in unsignedTxResponse &&
    'nonce' in previousTxResponse &&
    'nonce' in unsignedTxResponse.result &&
    typeof unsignedTxResponse.result === 'object' &&
    previousTxResponse.nonce === unsignedTxResponse.result.nonce
  ) {
    await wait(1_000)
    return await ebsiSignAndSendTransaction({ ...args, previousTxResponse }, context)
  }

  if ('error' in unsignedTxResponse && !!unsignedTxResponse.error) {
    logger.error(JSON.stringify(unsignedTxResponse))
    throw new Error(unsignedTxResponse.error.message ?? 'Unknown error occurred')
  }
  const unsignedTx = (unsignedTxResponse as RpcOkResponse).result

  const agentUnsignedTx = JSON.parse(JSON.stringify(unsignedTx))
  if (unsignedTx && 'chainId' in unsignedTx && typeof unsignedTx.chainId === 'string' && unsignedTx.chainId.toLowerCase().startsWith('0x')) {
    // We expect the chain id to be a regular number and not a hex string
    agentUnsignedTx.chainId = Number.parseInt(unsignedTx.chainId, 16)
  }
  const signedRawTx = await context.agent.keyManagerSignEthTX({
    kid,
    transaction: agentUnsignedTx,
  })

  const sig = Transaction.from(signedRawTx).signature!
  const { r, s, v } = sig

  const sTResponse = await callRpcMethod({
    params: [
      {
        protocol: 'eth',
        unsignedTransaction: unsignedTx,
        r,
        s,
        v: `0x${v.toString(16)}`,
        signedRawTransaction: signedRawTx,
      },
    ],
    rpcMethod: EbsiRpcMethod.SEND_SIGNED_TRANSACTION,
    rpcId: unsignedTxResponse.id,
    apiOpts,
    accessToken: accessToken,
  })

  if ('status' in sTResponse) {
    throw new Error(JSON.stringify(sTResponse, null, 2))
  }
  return { ...sTResponse, nonce }
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
          key.purposes.includes(EbsiPublicKeyPurpose.AssertionMethod) &&
          key.purposes.includes(EbsiPublicKeyPurpose.Authentication)
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

export const ebsiCreateDidOnLedger = async (args: CreateEbsiDidParams, context: IRequiredContext): Promise<CreateEbsiDidOnLedgerResult> => {
  const {
    accessTokenOpts,
    notBefore = Math.floor(Date.now() / 1000 - 60),
    notAfter = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60),
    baseDocument,
    identifier,
  } = args
  const { clientId, redirectUri, environment, credentialIssuer } = accessTokenOpts
  const controllerKey = getControllerKey({ identifier })
  const secp256r1 = getKeys({ identifier, keyType: 'Secp256r1' })?.[0]
  let { attestationToOnboard, attestationToOnboardCredentialRole } = accessTokenOpts

  if (!controllerKey || !secp256r1) {
    return Promise.reject(`No secp256k1 controller key and/or secp2561r key found for identifier ${identifier}`)
  }
  const from = getEthereumAddressFromKey({ key: controllerKey })
  if (!from) {
    return Promise.reject(Error(`EBSI 'from' address expected for key ${controllerKey.publicKeyHex}`))
  }
  const did = identifier.did
  const kid = controllerKey.kid
  const idOpts = { identifier, kid }
  let rpcId = args.rpcId ?? randomRpcId()
  const apiOpts = {
    environment,
    version: 'v5',
  } satisfies ApiOpts

  const jwksUri = args.accessTokenOpts.jwksUri ?? `${clientId}/.well-known/jwks/dids/${encodeURIComponent(identifier.did)}.json`

  if (!attestationToOnboard) {
    console.log(`No attestation to onboard present. Will get one`)
    const authReqResult = await context.agent.ebsiCreateAttestationAuthRequestURL({
      credentialIssuer,
      idOpts: idOpts,
      formats: ['jwt_vc'],
      clientId,
      redirectUri,
      credentialType: 'VerifiableAuthorisationToOnboard',
      requestObjectOpts: { iss: clientId, requestObjectMode: CreateRequestObjectMode.REQUEST_OBJECT, jwksUri },
    })
    const attestationResult = await context.agent.ebsiGetAttestation({
      clientId,
      authReqResult,
      opts: { timeout: 120_000 },
    })
    attestationToOnboard = attestationResult.credentials[0].rawVerifiableCredential as W3CVerifiableCredential
    console.log(`Attestation to onboard received`, attestationToOnboard)
  }

  const insertDidAccessTokenResponse = await context.agent.ebsiAccessTokenGet({
    credentialRole: attestationToOnboardCredentialRole,
    attestationCredential: attestationToOnboard,
    jwksUri,
    scope: 'didr_invite',
    idOpts: idOpts,
    redirectUri,
    credentialIssuer,
    clientId,
    environment,
    skipDidResolution: true,
  })

  const insertDidDocRequest = {
    params: [
      {
        from,
        did,
        baseDocument: baseDocument ?? BASE_CONTEXT_DOC,
        vMethodId: calculateJwkThumbprint({ jwk: toJwk(controllerKey.publicKeyHex, 'Secp256k1') }),
        isSecp256k1: true,
        publicKey: formatEbsiPublicKey({ key: controllerKey, type: 'Secp256k1' }),
        notBefore,
        notAfter,
      },
    ],
    rpcMethod: EbsiRpcMethod.INSERT_DID_DOCUMENT,
    rpcId,
    apiOpts,
    accessToken: insertDidAccessTokenResponse.accessTokenResponse.access_token,
  }

  const insertDidDocResponse = await ebsiSignAndSendTransaction(
    {
      rpcRequest: insertDidDocRequest,
      kid,
      accessToken: insertDidAccessTokenResponse.accessTokenResponse.access_token,
      apiOpts,
    },
    context,
  )

  let anchorTime = await ebsiWaitTillDocumentAnchored({
    did,
    ...apiOpts,
    maxWaitTime: 30_000,
    startIntervalMS: 2000,
    minIntervalMS: 500,
    decreaseIntervalMSPerStep: 750,
  })
  if (!anchorTime.didDocument) {
    throw Error(`did ${did} was not registered on EBSI network ${apiOpts.environment} in 45 seconds`)
  }
  logger.debug(`Anchoring did ${did} on network ${apiOpts.environment} took ${anchorTime.totalWaitTime / 1000} seconds in ${anchorTime.count} tries`)

  // Update to the controller key for the remainder
  idOpts.kid = calculateJwkThumbprintForKey({ key: controllerKey })

  const addVMAccessTokenResponse = await context.agent.ebsiAccessTokenGet({
    credentialRole: attestationToOnboardCredentialRole,
    // attestationCredential: attestationToOnboard,
    jwksUri,
    scope: 'didr_write',
    idOpts: idOpts,
    redirectUri,
    credentialIssuer: undefined,
    clientId,
    environment,
    skipDidResolution: true,
  })

  const vMethodId = calculateJwkThumbprint({ jwk: toJwk(secp256r1.publicKeyHex, 'Secp256r1') })
  const publicKey = formatEbsiPublicKey({ key: secp256r1, type: 'Secp256r1' })
  const addVerificationMethodRequest = {
    params: [
      {
        from,
        did,
        isSecp256k1: false,
        vMethodId,
        publicKey,
      },
    ],
    rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_METHOD,
    rpcId,
    apiOpts,
    accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
  }

  const addVerificationMethodResponse = await ebsiSignAndSendTransaction(
    {
      rpcRequest: addVerificationMethodRequest,
      previousTxResponse: insertDidDocResponse,
      kid,
      accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
      apiOpts,
    },
    context,
  )

  // We need to wait, even after the anchor. The methods below also retry in case the nonce does not get updated.
  // But we simply know that at this point we need to introduce some delay
  await wait(2_000)

  const addAssertionMethodRelationshipRequest = {
    params: [
      {
        from,
        did,
        vMethodId,
        name: 'assertionMethod',
        notAfter,
        notBefore,
      },
    ],
    rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_RELATIONSHIP,
    rpcId,
    apiOpts,
    accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
  }

  const addAssertionMethodRelationshipResponse = await ebsiSignAndSendTransaction(
    {
      rpcRequest: addAssertionMethodRelationshipRequest,
      previousTxResponse: addVerificationMethodResponse,
      kid,
      accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
      apiOpts,
    },
    context,
  )

  anchorTime = await ebsiWaitTillDocumentAnchored({
    did,
    ...apiOpts,
    maxWaitTime: 20_000,
    minIntervalMS: 500,
    decreaseIntervalMSPerStep: 500,
    searchForObject: { assertionMethod: [`${did}#${vMethodId}`] },
  })
  if (!anchorTime.didDocument) {
    throw Error(`did ${did} assertionMethod id ${vMethodId} was not registered on EBSI network ${apiOpts.environment} in 20 seconds`)
  }
  logger.debug(
    `Anchoring assertionMethod ${vMethodId} for DID ${did} on network ${apiOpts.environment} took ${anchorTime.totalWaitTime / 1000} seconds in ${anchorTime.count} tries`,
  )

  const addAuthenticationRelationshipRequest = {
    params: [
      {
        from,
        did,
        vMethodId,
        name: 'authentication',
        notAfter,
        notBefore,
      },
    ],
    rpcMethod: EbsiRpcMethod.ADD_VERIFICATION_RELATIONSHIP,
    rpcId,
    apiOpts,
    accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
  }

  const addAuthenticationRelationshipResponse = await ebsiSignAndSendTransaction(
    {
      rpcRequest: addAuthenticationRelationshipRequest,
      previousTxResponse: addAssertionMethodRelationshipResponse,
      kid,
      accessToken: addVMAccessTokenResponse.accessTokenResponse.access_token,
      apiOpts,
    },
    context,
  )

  return {
    identifier,
    insertDidDoc: insertDidDocResponse,
    addVerificationMethod: addVerificationMethodResponse,
    addAuthenticationRelationship: addAuthenticationRelationshipResponse,
    addAssertionMethodRelationship: addAssertionMethodRelationshipResponse,
  }
}
