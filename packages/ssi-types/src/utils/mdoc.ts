import type {
  DocumentJson,
  IssuerSignedItemJson,
  IVerifiableCredential,
  MdocDecodedPayload,
  MdocDeviceResponse,
  MdocDocument,
  MdocIssuerSigned,
  MdocOid4vpIssuerSigned,
  MdocOid4vpMdocVpToken,
  WrappedMdocCredential,
  WrappedMdocPresentation,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation,
} from '../types'
import mdocPkg from '@sphereon/kmp-mdoc-core'
const { com } = mdocPkg
import { IProofPurpose, IProofType } from './did'

export function isWrappedMdocCredential(vc: WrappedVerifiableCredential): vc is WrappedMdocCredential {
  return vc.format === 'mso_mdoc'
}

export function isWrappedMdocPresentation(vp: WrappedVerifiablePresentation): vp is WrappedMdocPresentation {
  return vp.format === 'mso_mdoc'
}

export function getMdocDecodedPayload(mdoc: MdocDocument): MdocDecodedPayload {
  const mdocJson = mdoc.toJson()
  if (!mdocJson.issuerSigned.nameSpaces) {
    throw Error(`Cannot access Issuer Signed items from the Mdoc`)
  }

  const issuerSignedJson = mdoc.issuerSigned.toJsonDTO()
  const namespaces = issuerSignedJson.nameSpaces as unknown as Record<string, IssuerSignedItemJson[]>

  const decodedPayload: MdocDecodedPayload = {}
  for (const [namespace, items] of Object.entries(namespaces)) {
    decodedPayload[namespace] = items.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: item.value.value,
      }),
      {},
    )
  }

  return decodedPayload
}

/**
 * Decode an Mdoc from its issuerSigned OID4VP Base64URL (string) to an object containing the disclosures,
 * signed payload, decoded payload
 *
 */
export function decodeMdocIssuerSigned(oid4vpIssuerSigned: MdocOid4vpIssuerSigned): MdocDocument {
  // Issuer signed according to 18013-7 in base64url
  const issuerSigned: MdocIssuerSigned = com.sphereon.mdoc.data.device.IssuerSignedCbor.Static.cborDecode(
    com.sphereon.kmp.decodeFrom(oid4vpIssuerSigned, com.sphereon.kmp.Encoding.BASE64URL),
  )
  // Create an mdoc from it. // Validations need to be performed by the caller after this!
  const holderMdoc: MdocDocument = issuerSigned.toDocument()
  return holderMdoc
}

export function encodeMdocIssuerSigned(issuerSigned: MdocIssuerSigned, encoding: 'base64url' = 'base64url') {
  return com.sphereon.kmp.encodeTo(issuerSigned.cborEncode(), com.sphereon.kmp.Encoding.BASE64URL)
}

/**
 * Decode an Mdoc from its vp_token OID4VP Base64URL (string) to an object containing the disclosures,
 * signed payload, decoded payload
 *
 */
export function decodeMdocDeviceResponse(vpToken: MdocOid4vpMdocVpToken): MdocDeviceResponse {
  const deviceResponse = com.sphereon.mdoc.data.device.DeviceResponseCbor.Static.cborDecode(
    com.sphereon.kmp.decodeFrom(vpToken, com.sphereon.kmp.Encoding.BASE64URL),
  )
  return deviceResponse
}

function bytesToImageDataUri(value: unknown, mimeType = 'image/jpeg'): string {
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) return value
    // Convert base64url to standard base64 if needed
    let b64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    return `data:${mimeType};base64,${b64}`
  }
  // Int8Array or Uint8Array from CBOR byte string decoder
  if (value && typeof value === 'object' && ('length' in value || Symbol.iterator in Object(value))) {
    try {
      const int8 = value instanceof Int8Array ? value : new Int8Array(value as ArrayLike<number>)
      const base64 = com.sphereon.kmp.encodeTo(int8, com.sphereon.kmp.Encoding.BASE64)
      return `data:${mimeType};base64,${base64}`
    } catch {
      // Fallback: try manual base64 encoding for Uint8Array
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value as ArrayLike<number>)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const base64 = typeof btoa === 'function' ? btoa(binary) : com.sphereon.kmp.encodeTo(new Int8Array(bytes), com.sphereon.kmp.Encoding.BASE64)
      return `data:${mimeType};base64,${base64}`
    }
  }
  return String(value)
}

// TODO naive implementation of mapping a mdoc onto a IVerifiableCredential. Needs some fixes and further implementation and needs to be moved out of ssi-types
export const mdocDecodedCredentialToUniformCredential = (
  decoded: MdocDocument,
  // @ts-ignore
  opts?: { maxTimeSkewInMS?: number; issuer?: string },
): IVerifiableCredential => {
  const document = decoded.toJson()
  const json = document.toJsonDTO<DocumentJson>()
  const MSO = document.MSO
  if (!MSO || !json.issuerSigned?.nameSpaces) {
    throw Error(`Cannot access Mobile Security Object or Issuer Signed items from the Mdoc`)
  }
  const nameSpaces = json.issuerSigned.nameSpaces as unknown as Record<string, IssuerSignedItemJson[]>
  const nameSpaceKeys = Object.keys(nameSpaces)
  if (nameSpaceKeys.length === 0) {
    throw Error(`No namespaces found in issuer signed items`)
  }
  // Collect items from all namespaces
  const items: IssuerSignedItemJson[] = []
  for (const ns of nameSpaceKeys) {
    items.push(...(nameSpaces[ns] || []))
  }
  if (items.length === 0) {
    throw Error(`No issuer signed items were found`)
  }
  type DisclosuresAccumulator = {
    [key: string]: any
  }

  // Known image claims in ISO 18013-5
  const IMAGE_CLAIMS = new Set(['portrait', 'signature_usual_mark'])

  const credentialSubject = items.reduce((acc: DisclosuresAccumulator, item: IssuerSignedItemJson) => {
    if (Array.isArray(item.value)) {
      acc[item.key] = item.value.map((val) => val.value).join(', ')
    } else {
      const value = item.value.value
      if (IMAGE_CLAIMS.has(item.key) && value != null) {
        // Convert byte string to data URI for image rendering
        acc[item.key] = bytesToImageDataUri(value)
      } else {
        acc[item.key] = value
      }
    }
    return acc
  }, {})
  const validFrom = MSO.validityInfo.validFrom
  const validUntil = MSO.validityInfo.validUntil
  const docType = MSO.docType
  const expirationDate = validUntil
  let issuanceDateStr = validFrom

  const issuanceDate = issuanceDateStr
  if (!issuanceDate) {
    throw Error(`JWT issuance date is required but was not present`)
  }

  // Determine issuer: x5c CN > issuing_authority claim > opts.issuer fallback > docType
  let issuer: string = opts?.issuer ?? docType
  // Try issuing_authority from credential claims (present in mDL and some other doctypes)
  if (credentialSubject.issuing_authority) {
    issuer = credentialSubject.issuing_authority
  }
  // Try to extract CN from x5chain certificate in issuerAuth (most authoritative for mdoc)
  try {
    const x5chain = json.issuerSigned?.issuerAuth?.unprotectedHeader?.x5chain ?? json.issuerSigned?.issuerAuth?.protectedHeader?.x5chain
    if (x5chain && x5chain.length > 0) {
      // x5chain[0] is base64-encoded DER certificate. Extract CN by searching for OID 2.5.4.3 (55 04 03)
      const b64 = x5chain[0]
      let bytes: Uint8Array
      if (typeof atob === 'function') {
        const binaryStr = atob(b64)
        bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      } else {
        const int8 = com.sphereon.kmp.decodeFrom(b64, com.sphereon.kmp.Encoding.BASE64)
        bytes = new Uint8Array(int8)
      }
      // Find last CN OID (55 04 03) — last occurrence is the subject CN
      let lastCn: string | undefined
      for (let i = 0; i < bytes.length - 5; i++) {
        if (bytes[i] === 0x55 && bytes[i + 1] === 0x04 && bytes[i + 2] === 0x03) {
          const tag = bytes[i + 3] // 0x0c=UTF8String, 0x13=PrintableString
          if (tag === 0x0c || tag === 0x13) {
            const len = bytes[i + 4]
            if (i + 5 + len <= bytes.length) {
              const cn = String.fromCharCode(...bytes.slice(i + 5, i + 5 + len))
              lastCn = cn
            }
          }
        }
      }
      if (lastCn) {
        issuer = lastCn
      }
    }
  } catch {
    // Certificate parsing failed, keep previous issuer value
  }

  const credential: Omit<IVerifiableCredential, 'issuanceDate'> = {
    type: [docType], // Mdoc not a W3C VC, so no VerifiableCredential
    '@context': [], // Mdoc has no JSON-LD by default. Certainly not the VC DM1 default context for JSON-LD
    issuer,
    credentialSubject: {
      type: docType,
      ...credentialSubject,
    },
    issuanceDate,
    expirationDate,
    proof: {
      type: IProofType.MdocProof2024,
      created: issuanceDate,
      proofPurpose: IProofPurpose.authentication,
      verificationMethod: json.issuerSigned.issuerAuth.payload,
      mso_mdoc: com.sphereon.kmp.encodeTo(decoded.cborEncode(), com.sphereon.kmp.Encoding.BASE64URL),
    },
  }

  return credential as IVerifiableCredential
}
