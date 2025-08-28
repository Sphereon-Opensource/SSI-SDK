import type { BitsPerStatus } from '@sd-jwt/jwt-status-list'
import { StatusList } from '@sd-jwt/jwt-status-list'
import { deflate, inflate } from 'pako'

import mdocPkg from '@sphereon/kmp-mdoc-core'
const { com, kotlin } = mdocPkg

import base64url from 'base64url'
import type { IRequiredContext, SignedStatusListData } from '../../types'
import { type DecodedStatusListPayload, resolveIdentifier } from './common'

export type IKey = mdocPkg.com.sphereon.crypto.IKey
export type CborItem<T> = mdocPkg.com.sphereon.cbor.CborItem<T>
export const CborByteString = mdocPkg.com.sphereon.cbor.CborByteString
export type CborByteStringType = mdocPkg.com.sphereon.cbor.CborByteString
export const CborUInt = mdocPkg.com.sphereon.cbor.CborUInt
export type CborUIntType = mdocPkg.com.sphereon.cbor.CborUInt
export const CborString = mdocPkg.com.sphereon.cbor.CborString
export type CborStringType = mdocPkg.com.sphereon.cbor.CborString

// const cbor = cborpkg.com.sphereon.cbor
// const kmp = cborpkg. mdoc.com.sphereon.kmp
// const kotlin = cborpkg.kotlin
const decompressRawStatusList = (StatusList as any).decodeStatusList.bind(StatusList)

const CWT_CLAIMS = {
  SUBJECT: 2,
  ISSUER: 1,
  ISSUED_AT: 6,
  EXPIRATION: 4,
  TIME_TO_LIVE: 65534,
  STATUS_LIST: 65533,
} as const

export const createSignedCbor = async (
  context: IRequiredContext,
  statusList: StatusList,
  issuerString: string,
  id: string,
  expiresAt?: Date,
  keyRef?: string,
): Promise<SignedStatusListData> => {
  const identifier = await resolveIdentifier(context, issuerString, keyRef)

  const encodeStatusList = statusList.encodeStatusList()
  const compressedList = deflate(encodeStatusList, { level: 9 })
  const compressedBytes = new Int8Array(compressedList)

  const statusListMap = new com.sphereon.cbor.CborMap(
    kotlin.collections.KtMutableMap.fromJsMap(
      new Map<CborStringType, CborItem<any>>([
        [
          new com.sphereon.cbor.CborString('bits'),
          new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(statusList.getBitsPerStatus())),
        ],
        [new com.sphereon.cbor.CborString('lst'), new com.sphereon.cbor.CborByteString(compressedBytes)],
      ]),
    ),
  )

  const protectedHeader = new com.sphereon.cbor.CborMap(
    kotlin.collections.KtMutableMap.fromJsMap(
      new Map([[new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(16)), new com.sphereon.cbor.CborString('statuslist+cwt')]]), // "type"
    ),
  )
  const protectedHeaderEncoded = com.sphereon.cbor.Cbor.encode(protectedHeader)
  const claimsMap = buildClaimsMap(id, issuerString, statusListMap, expiresAt)
  const claimsEncoded: Int8Array = com.sphereon.cbor.Cbor.encode(claimsMap)

  const signedCWT: string = await context.agent.keyManagerSign({
    keyRef: identifier.kmsKeyRef,
    data: base64url.encode(Buffer.from(claimsEncoded)), // TODO test on RN
    encoding: undefined,
  })

  const protectedHeaderEncodedInt8 = new Int8Array(protectedHeaderEncoded)
  const claimsEncodedInt8 = new Int8Array(claimsEncoded)
  const signatureBytes = base64url.decode(signedCWT)
  const signatureInt8 = new Int8Array(Buffer.from(signatureBytes))

  const cwtArrayElements: Array<CborItem<any>> = [
    new CborByteString(protectedHeaderEncodedInt8),
    new CborByteString(claimsEncodedInt8),
    new CborByteString(signatureInt8),
  ]
  const cwtArray = new com.sphereon.cbor.CborArray(kotlin.collections.KtMutableList.fromJsArray(cwtArrayElements))
  const cwtEncoded = com.sphereon.cbor.Cbor.encode(cwtArray)
  const cwtBuffer = Buffer.from(cwtEncoded)
  return {
    statusListCredential: base64url.encode(cwtBuffer),
    encodedList: base64url.encode(compressedList as Buffer), // JS in @sd-jwt/jwt-status-list drops it in like this, so keep the same method
  }
}

function buildClaimsMap(
  id: string,
  issuerString: string,
  statusListMap: mdocPkg.com.sphereon.cbor.CborMap<CborStringType, CborItem<any>>,
  expiresAt?: Date,
) {
  const ttl = 65535 // FIXME figure out what value should be / come from and what the difference is with exp
  const claimsEntries: Array<[CborUIntType, CborItem<any>]> = [
    [new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.SUBJECT)), new com.sphereon.cbor.CborString(id)], // "sub"
    [new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.ISSUER)), new com.sphereon.cbor.CborString(issuerString)], // "iss"
    [
      new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.ISSUED_AT)),
      new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(Math.floor(Date.now() / 1000))), // "iat"
    ],
  ]

  if (expiresAt) {
    claimsEntries.push([
      new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.EXPIRATION)),
      new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(Math.floor(expiresAt.getTime() / 1000))), // "exp"
    ])
  }

  if (ttl) {
    claimsEntries.push([
      new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.TIME_TO_LIVE)),
      new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(ttl)), // "time to live"
    ])
  }

  claimsEntries.push([new com.sphereon.cbor.CborUInt(com.sphereon.kmp.LongKMP.fromNumber(CWT_CLAIMS.STATUS_LIST)), statusListMap])

  const claimsMap = new com.sphereon.cbor.CborMap(kotlin.collections.KtMutableMap.fromJsMap(new Map(claimsEntries)))
  return claimsMap
}

const getCborValueFromMap = <T>(map: Map<CborItem<any>, CborItem<any>>, key: number): T => {
  const value = getCborOptionalValueFromMap<T>(map, key)
  if (value === undefined) {
    throw new Error(`Required claim ${key} not found`)
  }
  return value
}

const getCborOptionalValueFromMap = <T>(map: Map<CborItem<any>, CborItem<any>>, key: number): T | undefined | never => {
  const value = map.get(new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(key)))
  if (!value) {
    return undefined
  }
  return value.value as T
}

export const decodeStatusListCWT = (cwt: string): DecodedStatusListPayload => {
  const encodedCbor = base64url.toBuffer(cwt)
  const encodedCborArray = new Int8Array(encodedCbor)
  const decodedCbor = com.sphereon.cbor.Cbor.decode(encodedCborArray)

  if (!(decodedCbor instanceof com.sphereon.cbor.CborArray)) {
    throw new Error('Invalid CWT format: Expected a CBOR array')
  }

  const [, payload] = decodedCbor.value.asJsArrayView()
  if (!(payload instanceof com.sphereon.cbor.CborByteString)) {
    throw new Error('Invalid payload format: Expected a CBOR ByteString')
  }

  const claims = com.sphereon.cbor.Cbor.decode(payload.value)
  if (!(claims instanceof com.sphereon.cbor.CborMap)) {
    throw new Error('Invalid claims format: Expected a CBOR map')
  }

  const claimsMap = claims.value.asJsMapView()

  const statusListMap = claimsMap.get(new CborUInt(com.sphereon.kmp.LongKMP.fromNumber(65533))).value.asJsMapView()

  const bits = Number(statusListMap.get(new CborString('bits')).value) as BitsPerStatus
  const decoded = new Uint8Array(statusListMap.get(new CborString('lst')).value)
  const uint8Array = inflate(decoded)
  const rawStatusList = decompressRawStatusList(uint8Array, bits)
  const statusList = new StatusList(rawStatusList, bits)

  return {
    issuer: getCborValueFromMap<string>(claimsMap, CWT_CLAIMS.ISSUER),
    id: getCborValueFromMap<string>(claimsMap, CWT_CLAIMS.SUBJECT),
    statusList,
    iat: Number(getCborValueFromMap<number>(claimsMap, CWT_CLAIMS.ISSUED_AT)),
    exp: getCborOptionalValueFromMap<number>(claimsMap, CWT_CLAIMS.EXPIRATION),
    ttl: getCborOptionalValueFromMap<number>(claimsMap, CWT_CLAIMS.TIME_TO_LIVE),
  }
}
