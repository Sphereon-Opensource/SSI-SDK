import { computeAddress } from '@ethersproject/transactions'
import { UniResolver } from '@sphereon/did-uni-client'
import {
  ENC_KEY_ALGS,
  getKms,
  JwkKeyUse,
  keyTypeFromCryptographicSuite,
  rsaJwkToRawHexKey,
  sanitizedJwk,
  signatureAlgorithmFromKey,
  type TKeyType,
  toJwk,
  toPkcs1FromHex,
} from '@sphereon/ssi-sdk-ext.key-utils'
import { base64ToHex } from '@sphereon/ssi-sdk-ext.x509-utils'
import { base58ToBytes, base64ToBytes, bytesToHex, hexToBytes, multibaseKeyToBytes } from '@sphereon/ssi-sdk.core'
import type { JWK } from '@sphereon/ssi-types'
import { convertPublicKeyToX25519 } from '@stablelib/ed25519'
import type { DIDDocument, DIDDocumentSection, DIDResolutionResult, IAgentContext, IDIDManager, IIdentifier, IKey, IResolver } from '@veramo/core'
import {
  type _ExtendedIKey,
  type _ExtendedVerificationMethod,
  type _NormalizedVerificationMethod,
  compressIdentifierSecp256k1Keys,
  convertIdentifierEncryptionKeys,
  getEthereumAddress,
  isDefined,
  mapIdentifierKeysToDoc,
} from '@veramo/utils'
import { createJWT, Signer } from 'did-jwt'
import type { DIDResolutionOptions, JsonWebKey, Resolvable, VerificationMethod } from 'did-resolver'
// @ts-ignore
import elliptic from 'elliptic'
// @ts-ignore
import * as u8a from 'uint8arrays'
import {
  type CreateIdentifierOpts,
  type CreateOrGetIdentifierOpts,
  DID_PREFIX,
  type GetOrCreateResult,
  type GetSignerArgs,
  IdentifierAliasEnum,
  type IdentifierProviderOpts,
  type IDIDOptions,
  type SignJwtArgs,
  SupportedDidMethodEnum,
} from './types'

const { fromString, toString } = u8a

export const getAuthenticationKey = async (
  {
    identifier,
    offlineWhenNoDIDRegistered,
    noVerificationMethodFallback,
    keyType,
    controllerKey,
  }: {
    identifier: IIdentifier
    keyType?: TKeyType
    offlineWhenNoDIDRegistered?: boolean
    noVerificationMethodFallback?: boolean
    controllerKey?: boolean
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<_ExtendedIKey> => {
  return await getFirstKeyWithRelation(
    {
      identifier,
      offlineWhenNoDIDRegistered,
      noVerificationMethodFallback,
      keyType,
      controllerKey,
      vmRelationship: 'authentication',
    },
    context
  )
}
export const getFirstKeyWithRelation = async (
  {
    identifier,
    offlineWhenNoDIDRegistered,
    noVerificationMethodFallback,
    keyType,
    controllerKey,
    vmRelationship,
  }: {
    identifier: IIdentifier
    keyType?: TKeyType
    offlineWhenNoDIDRegistered?: boolean
    noVerificationMethodFallback?: boolean
    controllerKey?: boolean
    vmRelationship: DIDDocumentSection
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<_ExtendedIKey> => {
  let key: _ExtendedIKey | undefined = undefined
  try {
    key =
      (await getFirstKeyWithRelationFromDIDDoc(
        {
          identifier,
          vmRelationship,
          errorOnNotFound: false,
          keyType,
          controllerKey,
        },
        context
      )) ??
      (noVerificationMethodFallback || vmRelationship === 'verificationMethod' // let's not fallback to the same value again
        ? undefined
        : await getFirstKeyWithRelationFromDIDDoc(
            {
              identifier,
              vmRelationship: 'verificationMethod',
              errorOnNotFound: false,
              keyType,
              controllerKey,
            },
            context
          ))
  } catch (e) {
    if (e instanceof Error) {
      if (!e.message.includes('404') || !offlineWhenNoDIDRegistered) {
        throw e
      }
    } else {
      throw e
    }
  }
  if (!key && offlineWhenNoDIDRegistered) {
    const offlineDID = toDidDocument(identifier)
    key =
      (await getFirstKeyWithRelationFromDIDDoc(
        {
          identifier,
          vmRelationship,
          errorOnNotFound: false,
          didDocument: offlineDID,
          keyType,
          controllerKey,
        },
        context
      )) ??
      (noVerificationMethodFallback || vmRelationship === 'verificationMethod' // let's not fallback to the same value again
        ? undefined
        : await getFirstKeyWithRelationFromDIDDoc(
            {
              identifier,
              vmRelationship: 'verificationMethod',
              errorOnNotFound: false,
              didDocument: offlineDID,
              keyType,
              controllerKey,
            },
            context
          ))
    if (!key) {
      key = identifier.keys
        .map((key) => key as _ExtendedIKey)
        .filter((key) => keyType === undefined || key.type === keyType || (controllerKey && key.kid === identifier.controllerKeyId))
        .find((key) => key.meta.verificationMethod?.type.includes('authentication') || key.meta.purposes?.includes('authentication'))
    }
  }
  if (!key) {
    throw Error(`Could not find authentication key for DID ${identifier.did}`)
  }
  return key
}

export const getOrCreatePrimaryIdentifier = async (
  context: IAgentContext<IDIDManager>,
  opts?: CreateOrGetIdentifierOpts
): Promise<GetOrCreateResult<IIdentifier>> => {
  const primaryIdentifier = await getPrimaryIdentifier(context, { ...opts?.createOpts?.options, ...(opts?.method && { method: opts.method }) })
  if (primaryIdentifier !== undefined) {
    return {
      created: false,
      result: primaryIdentifier,
    }
  }

  if (opts?.method === SupportedDidMethodEnum.DID_KEY) {
    const createOpts = opts?.createOpts ?? {}
    createOpts.options = { codecName: 'EBSI', type: 'Secp256r1', ...createOpts }
    opts.createOpts = createOpts
  }
  const createdIdentifier = await createIdentifier(context, opts)
  return {
    created: true,
    result: createdIdentifier,
  }
}

export const getPrimaryIdentifier = async (context: IAgentContext<IDIDManager>, opts?: IdentifierProviderOpts): Promise<IIdentifier | undefined> => {
  const identifiers = (await context.agent.didManagerFind(opts?.method ? { provider: `${DID_PREFIX}${opts?.method}` } : {})).filter(
    (identifier: IIdentifier) => opts?.type === undefined || identifier.keys.some((key: IKey) => key.type === opts?.type)
  )

  return identifiers && identifiers.length > 0 ? identifiers[0] : undefined
}

export const createIdentifier = async (context: IAgentContext<IDIDManager>, opts?: CreateIdentifierOpts): Promise<IIdentifier> => {
  return await context.agent.didManagerCreate({
    kms: await getKms(context, opts?.createOpts?.kms),
    ...(opts?.method && { provider: `${DID_PREFIX}${opts?.method}` }),
    alias: opts?.createOpts?.alias ?? `${IdentifierAliasEnum.PRIMARY}-${opts?.method}-${opts?.createOpts?.options?.type}-${new Date().getTime()}`,
    options: opts?.createOpts?.options,
  })
}

export const getFirstKeyWithRelationFromDIDDoc = async (
  {
    identifier,
    vmRelationship = 'verificationMethod',
    keyType,
    errorOnNotFound = false,
    didDocument,
    controllerKey,
  }: {
    identifier: IIdentifier
    controllerKey?: boolean
    vmRelationship?: DIDDocumentSection
    keyType?: TKeyType
    errorOnNotFound?: boolean
    didDocument?: DIDDocument
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<_ExtendedIKey | undefined> => {
  const matchedKeys = await mapIdentifierKeysToDocWithJwkSupport({ identifier, vmRelationship, didDocument }, context)
  if (Array.isArray(matchedKeys) && matchedKeys.length > 0) {
    const result = matchedKeys.find(
      (key) => keyType === undefined || key.type === keyType || (controllerKey && key.kid === identifier.controllerKeyId)
    )
    if (result) {
      return result
    }
  }
  if (errorOnNotFound) {
    throw new Error(
      `Could not find key with relationship ${vmRelationship} in DID document for ${identifier.did}${keyType ? ' and key type: ' + keyType : ''}`
    )
  }
  return undefined
}

export const getEthereumAddressFromKey = ({ key }: { key: IKey }) => {
  if (key.type !== 'Secp256k1') {
    throw Error(`Can only get ethereum address from a Secp256k1 key. Type is ${key.type} for keyRef: ${key.kid}`)
  }
  const ethereumAddress = key.meta?.ethereumAddress ?? key.meta?.account?.toLowerCase() ?? computeAddress(`0x${key.publicKeyHex}`).toLowerCase()
  if (!ethereumAddress) {
    throw Error(`Could not get or generate ethereum address from key with keyRef ${key.kid}`)
  }
  return ethereumAddress
}

export const getControllerKey = ({ identifier }: { identifier: IIdentifier }) => {
  const key = identifier.keys.find((key) => key.kid === identifier.controllerKeyId)
  if (!key) {
    throw Error(`Could not get controller key for identifier ${identifier}`)
  }
  return key
}

export const getKeys = ({
  jwkThumbprint,
  kms,
  identifier,
  kmsKeyRef,
  keyType,
  controllerKey,
}: {
  identifier: IIdentifier
  kmsKeyRef?: string
  keyType?: TKeyType
  kms?: string
  jwkThumbprint?: string
  controllerKey?: boolean
}) => {
  return identifier.keys
    .filter((key) => !keyType || key.type === keyType)
    .filter((key) => !kms || key.kms === kms)
    .filter((key) => !kmsKeyRef || key.kid === kmsKeyRef)
    .filter((key) => !jwkThumbprint || key.meta?.jwkThumbprint === jwkThumbprint)
    .filter((key) => !controllerKey || identifier.controllerKeyId === key.kid)
}

//TODO: Move to ssi-sdk/core and create PR upstream
/**
 * Dereferences keys from DID document and normalizes them for easy comparison.
 *
 * When dereferencing keyAgreement keys, only Ed25519 and X25519 curves are supported.
 * Other key types are omitted from the result and Ed25519 keys are converted to X25519
 *
 * @returns a Promise that resolves to the list of dereferenced keys.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export async function dereferenceDidKeysWithJwkSupport(
  didDocument: DIDDocument,
  section: DIDDocumentSection = 'keyAgreement',
  context: IAgentContext<IResolver>
): Promise<_NormalizedVerificationMethod[]> {
  const convert = section === 'keyAgreement'
  if (section === 'service') {
    return []
  }
  return (
    await Promise.all(
      (didDocument[section] || []).map(async (key: string | VerificationMethod) => {
        if (typeof key === 'string') {
          try {
            return (await context.agent.getDIDComponentById({
              didDocument,
              didUrl: key,
              section,
            })) as _ExtendedVerificationMethod
          } catch (e) {
            return null
          }
        } else {
          return key as _ExtendedVerificationMethod
        }
      })
    )
  )
    .filter(isDefined)
    .map((key) => {
      const hexKey = extractPublicKeyHexWithJwkSupport(key, convert)
      const { publicKeyHex, publicKeyBase58, publicKeyBase64, publicKeyJwk, ...keyProps } = key
      const newKey = { ...keyProps, publicKeyHex: hexKey }
      if (convert && 'Ed25519VerificationKey2018' === newKey.type) {
        newKey.type = 'X25519KeyAgreementKey2019'
      }
      return newKey
    })
}

export function jwkTtoPublicKeyHex(jwk: JWK): string {
  // todo: Hacky way to convert this to a VM. Should extract the logic from the below methods
  // @ts-ignore
  const vm: _ExtendedVerificationMethod = {
    publicKeyJwk: sanitizedJwk(jwk),
  }
  return extractPublicKeyHexWithJwkSupport(vm)
}

/**
 * Converts the publicKey of a VerificationMethod to hex encoding (publicKeyHex)
 *
 * @param pk - the VerificationMethod to be converted
 * @param convert - when this flag is set to true, Ed25519 keys are converted to their X25519 pairs
 * @returns the hex encoding of the public key
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function extractPublicKeyHexWithJwkSupport(pk: _ExtendedVerificationMethod, convert = false): string {
  if (pk.publicKeyJwk) {
    const jwk = sanitizedJwk(pk.publicKeyJwk)
    if (jwk.kty === 'EC') {
      const curve = jwk.crv ? toEcLibCurve(jwk.crv) : 'p256'
      const xHex = base64ToHex(jwk.x!, 'base64url')
      const yHex = base64ToHex(jwk.y!, 'base64url')
      const prefix = '04' // isEven(yHex) ? '02' : '03'
      // Uncompressed Hex format: 04<x><y>
      // Compressed Hex format: 02<x> (for even y) or 03<x> (for uneven y)
      const hex = `${prefix}${xHex}${yHex}`
      try {
        const ec = new elliptic.ec(curve)
        // We return directly as we don't want to convert the result back into Uint8Array and then convert again to hex as the elliptic lib already returns hex strings
        const publicKeyHex = ec.keyFromPublic(hex, 'hex').getPublic(true, 'hex')
        // This returns a short form (x) with 02 or 03 prefix
        return publicKeyHex
      } catch (error: any) {
        console.error(`Error converting EC with elliptic lib curve ${curve} from JWK to hex. x: ${jwk.x}, y: ${jwk.y}, error: ${error}`, error)
      }
    } else if (jwk.crv === 'Ed25519') {
      return toString(fromString(jwk.x!, 'base64url'), 'base16')
    } else if (jwk.kty === 'RSA') {
      return rsaJwkToRawHexKey(jwk)
      // return hexKeyFromPEMBasedJwk(jwk, 'public')
    }
  }
  // delegate the other types to the original Veramo function
  return extractPublicKeyHex(pk, convert)
}

export function isEvenHexString(hex: string) {
  const lastChar = hex[hex.length - 1].toLowerCase()
  return ['0', '2', '4', '6', '8', 'a', 'c', 'e'].includes(lastChar)
}

interface LegacyVerificationMethod extends VerificationMethod {
  publicKeyBase64: string
}

/**
 * Converts the publicKey of a VerificationMethod to hex encoding (publicKeyHex)
 *
 * @param pk - the VerificationMethod to be converted
 * @param convert - when this flag is set to true, Ed25519 keys are converted to their X25519 pairs
 * @returns the hex encoding of the public key
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export function extractPublicKeyHex(pk: _ExtendedVerificationMethod, convert: boolean = false): string {
  let keyBytes = extractPublicKeyBytes(pk)
  const jwk = pk.publicKeyJwk ? sanitizedJwk(pk.publicKeyJwk) : undefined
  if (convert) {
    if (
      ['Ed25519', 'Ed25519VerificationKey2018', 'Ed25519VerificationKey2020'].includes(pk.type) ||
      (pk.type === 'JsonWebKey2020' && jwk?.crv === 'Ed25519')
    ) {
      keyBytes = convertPublicKeyToX25519(keyBytes)
    } else if (
      !['X25519', 'X25519KeyAgreementKey2019', 'X25519KeyAgreementKey2020'].includes(pk.type) &&
      !(pk.type === 'JsonWebKey2020' && jwk?.crv === 'X25519')
    ) {
      return ''
    }
  }
  return bytesToHex(keyBytes)
}

function toEcLibCurve(input: string) {
  return input.toLowerCase().replace('-', '').replace('_', '')
}

function extractPublicKeyBytes(pk: VerificationMethod): Uint8Array {
  if (pk.publicKeyBase58) {
    return base58ToBytes(pk.publicKeyBase58)
  } else if (pk.publicKeyMultibase) {
    return multibaseKeyToBytes(pk.publicKeyMultibase)
  } else if ((<LegacyVerificationMethod>pk).publicKeyBase64) {
    return base64ToBytes((<LegacyVerificationMethod>pk).publicKeyBase64)
  } else if (pk.publicKeyHex) {
    return hexToBytes(pk.publicKeyHex)
  } else if (pk.publicKeyJwk?.crv && pk.publicKeyJwk.x && pk.publicKeyJwk.y) {
    return hexToBytes(extractPublicKeyHexWithJwkSupport(pk))
  } else if (pk.publicKeyJwk && (pk.publicKeyJwk.crv === 'Ed25519' || pk.publicKeyJwk.crv === 'X25519') && pk.publicKeyJwk.x) {
    return base64ToBytes(pk.publicKeyJwk.x)
  }
  return new Uint8Array()
}

export function verificationMethodToJwk(vm: VerificationMethod, errorOnNotFound = true): JWK | null {
  let jwk: JWK | undefined = vm.publicKeyJwk as JWK
  if (!jwk) {
    let publicKeyHex = vm.publicKeyHex ?? toString(extractPublicKeyBytes(vm), 'hex')
    if (publicKeyHex && publicKeyHex.trim() !== '') {
      jwk = toJwk(publicKeyHex, keyTypeFromCryptographicSuite({ crv: vm.type }))
    }
  }
  if (!jwk) {
    if (errorOnNotFound) {
      throw Error(`Could not convert verification method ${vm.id} to jwk`)
    }
    return null
  }
  jwk.kid = vm.id
  return sanitizedJwk(jwk)
}

function didDocumentSectionToJwks(
  didDocumentSection: DIDDocumentSection,
  searchForVerificationMethods?: (VerificationMethod | string)[],
  verificationMethods?: VerificationMethod[]
) {
  const jwks = new Set(
    (searchForVerificationMethods ?? [])
      .map((vmOrId) => (typeof vmOrId === 'object' ? vmOrId : verificationMethods?.find((vm) => vm.id === vmOrId)))
      .filter(isDefined)
      .map((vm) => verificationMethodToJwk(vm, false))
      .filter(isDefined)
  )
  return { didDocumentSection, jwks: Array.from(jwks) }
}

export type DidDocumentJwks = Record<Exclude<DIDDocumentSection, 'publicKey' | 'service'>, Array<JWK>>

export function didDocumentToJwks(didDocument: DIDDocument): DidDocumentJwks {
  return {
    verificationMethod: [
      ...didDocumentSectionToJwks('publicKey', didDocument.publicKey, didDocument.verificationMethod).jwks, // legacy support
      ...didDocumentSectionToJwks('verificationMethod', didDocument.verificationMethod, didDocument.verificationMethod).jwks,
    ],
    assertionMethod: didDocumentSectionToJwks('assertionMethod', didDocument.assertionMethod, didDocument.verificationMethod).jwks,
    authentication: didDocumentSectionToJwks('authentication', didDocument.authentication, didDocument.verificationMethod).jwks,
    keyAgreement: didDocumentSectionToJwks('keyAgreement', didDocument.keyAgreement, didDocument.verificationMethod).jwks,
    capabilityInvocation: didDocumentSectionToJwks('capabilityInvocation', didDocument.capabilityInvocation, didDocument.verificationMethod).jwks,
    capabilityDelegation: didDocumentSectionToJwks('capabilityDelegation', didDocument.capabilityDelegation, didDocument.verificationMethod).jwks,
  }
}

/**
 * Maps the keys of a locally managed {@link @veramo/core#IIdentifier | IIdentifier} to the corresponding
 * {@link did-resolver#VerificationMethod | VerificationMethod} entries from the DID document.
 *
 * @param identifier - the identifier to be mapped
 * @param section - the section of the DID document to be mapped (see
 *   {@link https://www.w3.org/TR/did-core/#verification-relationships | verification relationships}), but can also be
 *   `verificationMethod` to map all the keys.
 * @param didDocument
 * @param context - the veramo agent context, which must contain a {@link @veramo/core#IResolver | IResolver}
 *   implementation that can resolve the DID document of the identifier.
 *
 * @returns an array of mapped keys. The corresponding verification method is added to the `meta.verificationMethod`
 *   property of the key.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export async function mapIdentifierKeysToDocWithJwkSupport(
  {
    identifier,
    vmRelationship = 'verificationMethod',
    didDocument,
    kmsKeyRef,
  }: {
    identifier: IIdentifier
    vmRelationship?: DIDDocumentSection
    didDocument?: DIDDocument
    kmsKeyRef?: string
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<_ExtendedIKey[]> {
  const didDoc =
    didDocument ??
    (await getAgentResolver(context)
      .resolve(identifier.did)
      .then((result) => result.didDocument))
  if (!didDoc) {
    throw Error(`Could not resolve DID ${identifier.did}`)
  }

  // const rsaDidWeb = identifier.keys && identifier.keys.length > 0 && identifier.keys.find((key) => key.type === 'RSA') && didDocument

  // We skip mapping in case the identifier is RSA and a did document is supplied.
  const keys = didDoc ? [] : await mapIdentifierKeysToDoc(identifier, vmRelationship, context)

  // dereference all key agreement keys from DID document and normalize
  const documentKeys: VerificationMethod[] = await dereferenceDidKeysWithJwkSupport(didDoc, vmRelationship, context)

  if (kmsKeyRef) {
    let found = keys.filter((key) => key.kid === kmsKeyRef)
    if (found.length > 0) {
      return found
    }
  }

  const localKeys = vmRelationship === 'keyAgreement' ? convertIdentifierEncryptionKeys(identifier) : compressIdentifierSecp256k1Keys(identifier)

  // finally map the didDocument keys to the identifier keys by comparing `publicKeyHex`
  const extendedKeys: _ExtendedIKey[] = documentKeys
    .map((verificationMethod) => {
      let vmKey = verificationMethod.publicKeyHex
      if (vmKey?.startsWith('30')) {
        // DER encoded
        vmKey = toPkcs1FromHex(vmKey)
      }

      const localKey = localKeys.find(
        (localKey) =>
          localKey.publicKeyHex === vmKey ||
          (localKey.type === 'RSA' && vmKey?.startsWith('30') && toPkcs1FromHex(localKey.publicKeyHex) === vmKey) ||
          vmKey?.startsWith(localKey.publicKeyHex) ||
          compareBlockchainAccountId(localKey, verificationMethod)
      )
      if (localKey) {
        const { meta, ...localProps } = localKey
        return { ...localProps, meta: { ...meta, verificationMethod } }
      } else {
        return null
      }
    })
    .filter(isDefined)

  return Array.from(new Set(keys.concat(extendedKeys)))
}

/**
 * Compares the `blockchainAccountId` of a `EcdsaSecp256k1RecoveryMethod2020` verification method with the address
 * computed from a locally managed key.
 *
 * @returns true if the local key address corresponds to the `blockchainAccountId`
 *
 * @param localKey - The locally managed key
 * @param verificationMethod - a {@link did-resolver#VerificationMethod | VerificationMethod} with a
 *   `blockchainAccountId`
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
function compareBlockchainAccountId(localKey: IKey, verificationMethod: VerificationMethod): boolean {
  if (
    (verificationMethod.type !== 'EcdsaSecp256k1RecoveryMethod2020' && verificationMethod.type !== 'EcdsaSecp256k1VerificationKey2019') ||
    localKey.type !== 'Secp256k1'
  ) {
    return false
  }
  let vmEthAddr = getEthereumAddress(verificationMethod)
  if (localKey.meta?.account) {
    return vmEthAddr === localKey.meta?.account.toLowerCase()
  }
  const computedAddr = computeAddress('0x' + localKey.publicKeyHex).toLowerCase()
  return computedAddr === vmEthAddr
}

export async function getAgentDIDMethods(context: IAgentContext<IDIDManager>) {
  return (await context.agent.didManagerGetProviders()).map((provider) => provider.toLowerCase().replace('did:', ''))
}

export function getDID(idOpts: { identifier: IIdentifier | string }): string {
  if (typeof idOpts.identifier === 'string') {
    return idOpts.identifier
  } else if (typeof idOpts.identifier === 'object') {
    return idOpts.identifier.did
  }
  throw Error(`Cannot get DID from identifier value`)
}

export function toDID(identifier: string | IIdentifier | Partial<IIdentifier>): string {
  if (typeof identifier === 'string') {
    return identifier
  }
  if (identifier.did) {
    return identifier.did
  }
  throw Error(`No DID value present in identifier`)
}

export function toDIDs(identifiers?: (string | IIdentifier | Partial<IIdentifier>)[]): string[] {
  if (!identifiers) {
    return []
  }
  return identifiers.map(toDID)
}

export async function getKey(
  {
    identifier,
    vmRelationship = 'authentication',
    kmsKeyRef,
  }: {
    identifier: IIdentifier
    vmRelationship?: DIDDocumentSection
    kmsKeyRef?: string
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<_ExtendedIKey> {
  if (!identifier) {
    return Promise.reject(new Error(`No identifier provided to getKey method!`))
  }
  // normalize to kid, in case keyId was passed in as did#vm or #vm
  const kmsKeyRefParts = kmsKeyRef?.split(`#`)
  const kid = kmsKeyRefParts ? (kmsKeyRefParts?.length === 2 ? kmsKeyRefParts[1] : kmsKeyRefParts[0]) : undefined
  // todo: We really should do a keyRef and external kid here
  // const keyRefKeys = kmsKeyRef ? identifier.keys.find((key: IKey) => key.kid === kid || key?.meta?.jwkThumbprint === kid) : undefined
  let identifierKey: _ExtendedIKey | undefined = undefined

  const keys = await mapIdentifierKeysToDocWithJwkSupport({ identifier, vmRelationship: vmRelationship, kmsKeyRef: kmsKeyRef }, context)
  if (!keys || keys.length === 0) {
    throw new Error(`No keys found for verificationMethodSection: ${vmRelationship} and did ${identifier.did}`)
  }
  if (kmsKeyRef) {
    identifierKey = keys.find(
      (key: _ExtendedIKey) => key.meta.verificationMethod?.id === kmsKeyRef || (kid && key.meta.verificationMethod?.id?.includes(kid))
    )
  }
  if (!identifierKey) {
    identifierKey = keys.find(
      (key: _ExtendedIKey) => key.meta.verificationMethod?.type === vmRelationship || key.meta.purposes?.includes(vmRelationship)
    )
  }
  if (!identifierKey) {
    identifierKey = keys[0]
  }

  if (!identifierKey) {
    throw new Error(
      `No matching verificationMethodSection key found for keyId: ${kmsKeyRef} and vmSection: ${vmRelationship} for id ${identifier.did}`
    )
  }

  return identifierKey
}

/**
 *
 * @param identifier
 * @param context
 *
 * @deprecated Replaced by the identfier resolution plugin
 */
async function legacyGetIdentifier(
  {
    identifier,
  }: {
    identifier: string | IIdentifier
  },
  context: IAgentContext<IDIDManager>
): Promise<IIdentifier> {
  if (typeof identifier === 'string') {
    return await context.agent.didManagerGet({ did: identifier })
  }
  return identifier
}

/**
 * Get the real kid as used in JWTs. This is the kid in the VM or in the JWT, not the kid in the Veramo/Sphereon keystore. That was just a poorly chosen name
 * @param key
 * @param idOpts
 * @param context
 */
export async function determineKid(
  {
    key,
    idOpts,
  }: {
    key: IKey
    idOpts: { identifier: IIdentifier | string; kmsKeyRef?: string }
  },
  context: IAgentContext<IResolver & IDIDManager>
): Promise<string> {
  if (key.meta?.verificationMethod?.id) {
    return key.meta?.verificationMethod?.id
  }
  const identifier = await legacyGetIdentifier(idOpts, context)
  const mappedKeys = await mapIdentifierKeysToDocWithJwkSupport(
    {
      identifier,
      vmRelationship: 'verificationMethod',
    },
    context
  )
  const vmKey = mappedKeys.find((extendedKey) => extendedKey.kid === key.kid)
  if (vmKey) {
    return vmKey.meta?.verificationMethod?.id ?? vmKey.meta?.jwkThumbprint ?? idOpts.kmsKeyRef ?? vmKey.kid
  }

  return key.meta?.jwkThumbprint ?? idOpts.kmsKeyRef ?? key.kid
}

export async function getSupportedDIDMethods(didOpts: IDIDOptions, context: IAgentContext<IDIDManager>) {
  return didOpts.supportedDIDMethods ?? (await getAgentDIDMethods(context))
}

export function getAgentResolver(
  context: IAgentContext<IResolver & IDIDManager>,
  opts?: {
    localResolution?: boolean // Resolve identifiers hosted by the agent
    uniresolverResolution?: boolean // Resolve identifiers using universal resolver
    resolverResolution?: boolean // Use registered drivers
  }
): Resolvable {
  return new AgentDIDResolver(context, opts)
}

export class AgentDIDResolver implements Resolvable {
  private readonly context: IAgentContext<IResolver & IDIDManager>
  private readonly resolverResolution: boolean
  private readonly uniresolverResolution: boolean
  private readonly localResolution: boolean

  constructor(
    context: IAgentContext<IResolver & IDIDManager>,
    opts?: { uniresolverResolution?: boolean; localResolution?: boolean; resolverResolution?: boolean }
  ) {
    this.context = context
    this.resolverResolution = opts?.resolverResolution !== false
    this.uniresolverResolution = opts?.uniresolverResolution !== false
    this.localResolution = opts?.localResolution !== false
  }

  async resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> {
    let resolutionResult: DIDResolutionResult | undefined
    let origResolutionResult: DIDResolutionResult | undefined
    let err: any
    if (!this.resolverResolution && !this.localResolution && !this.uniresolverResolution) {
      throw Error(`No agent hosted DID resolution, regular agent resolution nor universal resolver resolution is enabled. Cannot resolve DIDs.`)
    }
    if (this.resolverResolution) {
      try {
        resolutionResult = await this.context.agent.resolveDid({ didUrl, options })
      } catch (error: unknown) {
        err = error
      }
    }
    if (resolutionResult) {
      origResolutionResult = resolutionResult
      if (resolutionResult.didDocument === null) {
        resolutionResult = undefined
      }
    } else {
      console.log(`Agent resolver resolution is disabled. This typically isn't desirable!`)
    }
    if (!resolutionResult && this.localResolution) {
      console.log(`Using local DID resolution, looking at DIDs hosted by the agent.`)
      try {
        const did = didUrl.split('#')[0]
        const iIdentifier = await this.context.agent.didManagerGet({ did })
        resolutionResult = toDidResolutionResult(iIdentifier, { did })
        if (resolutionResult.didDocument) {
          err = undefined
        } else {
          console.log(`Local resolution resulted in a DID Document for ${did}`)
        }
      } catch (error: unknown) {
        if (!err) {
          err = error
        }
      }
    }
    if (resolutionResult) {
      if (!origResolutionResult) {
        origResolutionResult = resolutionResult
      }
      if (!resolutionResult.didDocument) {
        resolutionResult = undefined
      }
    }
    if (!resolutionResult && this.uniresolverResolution) {
      console.log(`Using universal resolver resolution for did ${didUrl} `)
      resolutionResult = await new UniResolver().resolve(didUrl, options)
      if (!origResolutionResult) {
        origResolutionResult = resolutionResult
      }
      if (resolutionResult.didDocument) {
        err = undefined
      }
    }

    if (err) {
      // throw original error
      throw err
    }
    if (!resolutionResult && !origResolutionResult) {
      throw `Could not resolve ${didUrl}. Resolutions tried: online: ${this.resolverResolution}, local: ${this.localResolution}, uni resolver: ${this.uniresolverResolution}`
    }
    return resolutionResult ?? origResolutionResult!
  }
}

/**
 * Please note that this is not an exact representation of the actual DID Document.
 *
 * We try to do our best, to map keys onto relevant verification methods and relationships, but we simply lack the context
 * of the actual DID method here. Do not relly on this method for DID resolution. It is only handy for offline use cases
 * when no DID Document is cached. For DID:WEB it does provide an accurate representation!
 *
 * @param identifier
 * @param opts
 */
export function toDidDocument(
  identifier?: IIdentifier,
  opts?: {
    did?: string
    use?: JwkKeyUse[]
  }
): DIDDocument | undefined {
  let didDocument: DIDDocument | undefined = undefined
  // TODO: Introduce jwk thumbprints here
  if (identifier) {
    const did = identifier.did ?? opts?.did
    didDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
      verificationMethod: identifier.keys.map((key) => {
        const vm: VerificationMethod = {
          controller: did,
          id: key.kid.startsWith(did) && key.kid.includes('#') ? key.kid : `${did}#${key.kid}`,
          publicKeyJwk: toJwk(key.publicKeyHex, key.type, {
            use: ENC_KEY_ALGS.includes(key.type) ? JwkKeyUse.Encryption : JwkKeyUse.Signature,
            key,
          }) as JsonWebKey,
          type: 'JsonWebKey2020',
        }
        return vm
      }),
      ...((opts?.use === undefined || opts?.use?.includes(JwkKeyUse.Signature)) &&
        identifier.keys && {
          assertionMethod: identifier.keys
            .filter(
              (key) =>
                key?.meta?.purpose === undefined || key?.meta?.purpose === 'assertionMethod' || key?.meta?.purposes?.includes('assertionMethod')
            )
            .map((key) => {
              if (key.kid.startsWith(did) && key.kid.includes('#')) {
                return key.kid
              }
              return `${did}#${key.kid}`
            }),
        }),
      ...((opts?.use === undefined || opts?.use?.includes(JwkKeyUse.Signature)) &&
        identifier.keys && {
          authentication: identifier.keys
            .filter(
              (key) => key?.meta?.purpose === undefined || key?.meta?.purpose === 'authentication' || key?.meta?.purposes?.includes('authentication')
            )
            .map((key) => {
              if (key.kid.startsWith(did) && key.kid.includes('#')) {
                return key.kid
              }
              return `${did}#${key.kid}`
            }),
        }),
      ...((opts?.use === undefined || opts?.use?.includes(JwkKeyUse.Encryption)) &&
        identifier.keys && {
          keyAgreement: identifier.keys
            .filter((key) => key.type === 'X25519' || key?.meta?.purpose === 'keyAgreement' || key?.meta?.purposes?.includes('keyAgreement'))
            .map((key) => {
              if (key.kid.startsWith(did) && key.kid.includes('#')) {
                return key.kid
              }
              return `${did}#${key.kid}`
            }),
        }),
      ...((opts?.use === undefined || opts?.use?.includes(JwkKeyUse.Encryption)) &&
        identifier.keys && {
          capabilityInvocation: identifier.keys
            .filter(
              (key) => key.type === 'X25519' || key?.meta?.purpose === 'capabilityInvocation' || key?.meta?.purposes?.includes('capabilityInvocation')
            )
            .map((key) => {
              if (key.kid.startsWith(did) && key.kid.includes('#')) {
                return key.kid
              }
              return `${did}#${key.kid}`
            }),
        }),
      ...((opts?.use === undefined || opts?.use?.includes(JwkKeyUse.Encryption)) &&
        identifier.keys && {
          capabilityDelegation: identifier.keys
            .filter(
              (key) => key.type === 'X25519' || key?.meta?.purpose === 'capabilityDelegation' || key?.meta?.purposes?.includes('capabilityDelegation')
            )
            .map((key) => {
              if (key.kid.startsWith(did) && key.kid.includes('#')) {
                return key.kid
              }
              return `${did}#${key.kid}`
            }),
        }),
      ...(identifier.services && identifier.services.length > 0 && { service: identifier.services }),
    }
  }
  return didDocument
}

export function toDidResolutionResult(
  identifier?: IIdentifier,
  opts?: {
    did?: string
    supportedMethods?: string[]
  }
): DIDResolutionResult {
  const didDocument = toDidDocument(identifier, opts) ?? null // null is used in case of errors and required by the did resolution spec

  const resolutionResult: DIDResolutionResult = {
    '@context': 'https://w3id.org/did-resolution/v1',
    didDocument,
    didResolutionMetadata: {
      ...(!didDocument && { error: 'notFound' }),
      ...(Array.isArray(opts?.supportedMethods) &&
        identifier &&
        !opts?.supportedMethods.includes(identifier.provider.replace('did:', '')) && { error: 'unsupportedDidMethod' }),
    },
    didDocumentMetadata: {
      ...(identifier?.alias && { equivalentId: identifier?.alias }),
    },
  }
  return resolutionResult
}

export async function asDidWeb(hostnameOrDID: string): Promise<string> {
  let did = hostnameOrDID
  if (!did) {
    throw Error('Domain or DID expected, but received nothing.')
  }
  if (did.startsWith('did:web:')) {
    return did
  }
  return `did:web:${did.replace(/https?:\/\/([^/?#]+).*/i, '$1').toLowerCase()}`
}

/**
 * @deprecated Replaced by the new signer service
 */
export const signDidJWT = async (args: SignJwtArgs): Promise<string> => {
  const { idOpts, header, payload, context, options } = args
  const jwtOptions = {
    ...options,
    signer: await getDidSigner({ idOpts, context }),
  }

  return createJWT(payload, jwtOptions, header)
}

/**
 * @deprecated Replaced by the new signer service
 */
export const getDidSigner = async (
  args: GetSignerArgs & {
    idOpts: {
      /**
       * @deprecated
       */
      identifier: IIdentifier | string
      /**
       * @deprecated
       */
      verificationMethodSection?: DIDDocumentSection
      /**
       * @deprecated
       */
      kmsKeyRef?: string
    }
  }
): Promise<Signer> => {
  const { idOpts, context } = args

  const identifier = await legacyGetIdentifier(idOpts, context)
  const key = await getKey(
    {
      identifier,
      vmRelationship: idOpts.verificationMethodSection,
      kmsKeyRef: idOpts.kmsKeyRef,
    },
    context
  )
  const algorithm = await signatureAlgorithmFromKey({ key })

  return async (data: string | Uint8Array): Promise<string> => {
    const input = data instanceof Object.getPrototypeOf(Uint8Array) ? new TextDecoder().decode(data as Uint8Array) : (data as string)
    return await context.agent.keyManagerSign({
      keyRef: key.kid,
      algorithm,
      data: input,
    })
  }
}
