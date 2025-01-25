import { StatusList } from '@sd-jwt/jwt-status-list'
import { deflate, inflate } from 'pako'
import { com, kotlin } from '@sphereon/kmp-cbor'
import base64url from 'base64url'
import { IRequiredContext, SignedStatusListData } from '../../types'
import { DecodedStatusListPayload, resolveIdentifier } from './common'
import { BitsPerStatus } from '@sd-jwt/jwt-status-list/dist'

const cbor = com.sphereon.cbor
const kmp = com.sphereon.kmp
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
  keyRef?: string,
): Promise<SignedStatusListData> => {
  const identifier = await resolveIdentifier(context, issuerString, keyRef)

  const encodeStatusList = statusList.encodeStatusList()
  const compressedList = deflate(encodeStatusList, { level: 9 })
  const compressedBytes = new Int8Array(compressedList)

  const statusListMap = new cbor.CborMap(
    kotlin.collections.KtMutableMap.fromJsMap(
      new Map<com.sphereon.cbor.CborString, com.sphereon.cbor.CborItem<any>>([
        [new cbor.CborString('bits'), new cbor.CborUInt(kmp.LongKMP.fromNumber(statusList.getBitsPerStatus()))],
        [new cbor.CborString('lst'), new cbor.CborByteString(compressedBytes)],
      ]),
    ),
  )

  const protectedHeader = new cbor.CborMap(
    kotlin.collections.KtMutableMap.fromJsMap(
      new Map([[new cbor.CborUInt(kmp.LongKMP.fromNumber(16)), new cbor.CborString('statuslist+cwt')]]), // "type"
    ),
  )
  const protectedHeaderEncoded = cbor.Cbor.encode(protectedHeader)
  const claimsMap = buildClaimsMap(id, issuerString, statusListMap)
  const claimsEncoded: Int8Array = cbor.Cbor.encode(claimsMap)

  const signedCWT: string = await context.agent.keyManagerSign({
    keyRef: identifier.kmsKeyRef,
    data: base64url.encode(Buffer.from(claimsEncoded)), // TODO test on RN
    encoding: undefined,
  })

  const protectedHeaderEncodedInt8 = new Int8Array(protectedHeaderEncoded)
  const claimsEncodedInt8 = new Int8Array(claimsEncoded)
  const signatureBytes = base64url.decode(signedCWT)
  const signatureInt8 = new Int8Array(Buffer.from(signatureBytes))

  const cwtArray = new cbor.CborArray(
    kotlin.collections.KtMutableList.fromJsArray([
      new cbor.CborByteString(protectedHeaderEncodedInt8),
      new cbor.CborByteString(claimsEncodedInt8),
      new cbor.CborByteString(signatureInt8),
    ]),
  )

  const cwtEncoded = cbor.Cbor.encode(cwtArray)
  const cwtBuffer = Buffer.from(cwtEncoded)
  return {
    statusListCredential: base64url.encode(cwtBuffer),
    encodedList: base64url.encode(compressedList as Buffer), // JS in @sd-jwt/jwt-status-list drops it in like this, so keep the same method
  }
}

function buildClaimsMap(
  id: string,
  issuerString: string,
  statusListMap: com.sphereon.cbor.CborMap<com.sphereon.cbor.CborString, com.sphereon.cbor.CborItem<any>>,
) {
  const exp = Math.floor(new Date().getTime() / 1000)
  const ttl = 65535 // FIXME figure out what value should be / come from and what the difference is with exp
  const claimsEntries: Array<[com.sphereon.cbor.CborUInt, com.sphereon.cbor.CborItem<any>]> = [
    [new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.SUBJECT)), new cbor.CborString(id)], // "sub"
    [new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.ISSUER)), new cbor.CborString(issuerString)], // "iss"
    [
      new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.ISSUED_AT)),
      new cbor.CborUInt(kmp.LongKMP.fromNumber(Math.floor(Date.now() / 1000))), // "iat"
    ],
  ]

  if (exp) {
    claimsEntries.push([
      new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.EXPIRATION)),
      new cbor.CborUInt(kmp.LongKMP.fromNumber(exp)), // "exp"
    ])
  }

  if (ttl) {
    claimsEntries.push([
      new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.TIME_TO_LIVE)),
      new cbor.CborUInt(kmp.LongKMP.fromNumber(ttl)), // "time to live"
    ])
  }

  claimsEntries.push([new cbor.CborUInt(kmp.LongKMP.fromNumber(CWT_CLAIMS.STATUS_LIST)), statusListMap])

  const claimsMap = new cbor.CborMap(kotlin.collections.KtMutableMap.fromJsMap(new Map(claimsEntries)))
  return claimsMap
}

const getCborValueFromMap = <T>(map: Map<com.sphereon.cbor.CborItem<any>, com.sphereon.cbor.CborItem<any>>, key: number): T | never => {
  const value = map.get(new com.sphereon.cbor.CborUInt(kmp.LongKMP.fromNumber(key)))
  if (!value) {
    throw new Error(`Required claim ${key} not found`)
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

  const statusListMap = claimsMap.get(new com.sphereon.cbor.CborUInt(kmp.LongKMP.fromNumber(65533))).value.asJsMapView()

  const bits = Number(statusListMap.get(new com.sphereon.cbor.CborString('bits')).value) as BitsPerStatus
  const decoded = new Uint8Array(statusListMap.get(new com.sphereon.cbor.CborString('lst')).value)
  const uint8Array = inflate(decoded)
  const rawStatusList = decompressRawStatusList(uint8Array, bits)
  const statusList = new StatusList(rawStatusList, bits)

  return {
    issuer: getCborValueFromMap<string>(claimsMap, CWT_CLAIMS.ISSUER),
    id: getCborValueFromMap<string>(claimsMap, CWT_CLAIMS.SUBJECT),
    statusList,
    exp: getCborValueFromMap<number>(claimsMap, CWT_CLAIMS.EXPIRATION),
    ttl: getCborValueFromMap<number>(claimsMap, CWT_CLAIMS.TIME_TO_LIVE),
    iat: Number(getCborValueFromMap<number>(claimsMap, CWT_CLAIMS.ISSUED_AT)),
  }
}
