import type {
  DocumentJson, IssuerSignedItemJson,
  IVerifiableCredential, MdocDecodedPayload, MdocDeviceResponse, MdocDocument, MdocIssuerSigned, MdocOid4vpIssuerSigned, MdocOid4vpMdocVpToken,
  WrappedMdocCredential,
  WrappedMdocPresentation,
  WrappedVerifiableCredential,
  WrappedVerifiablePresentation
} from '../types'
import * as mdoc from '@sphereon/kmp-mdoc-core'
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
  const issuerSigned: MdocIssuerSigned = mdoc.com.sphereon.mdoc.data.device.IssuerSignedCbor.Static.cborDecode(
    mdoc.com.sphereon.kmp.decodeFrom(oid4vpIssuerSigned, mdoc.com.sphereon.kmp.Encoding.BASE64URL),
  )
  // Create an mdoc from it. // Validations need to be performed by the caller after this!
  const holderMdoc: MdocDocument = issuerSigned.toDocument()
  return holderMdoc
}

export function encodeMdocIssuerSigned(issuerSigned: MdocIssuerSigned, encoding: 'base64url' = 'base64url') {
  return mdoc.com.sphereon.kmp.encodeTo(issuerSigned.cborEncode(), mdoc.com.sphereon.kmp.Encoding.BASE64URL)
}

/**
 * Decode an Mdoc from its vp_token OID4VP Base64URL (string) to an object containing the disclosures,
 * signed payload, decoded payload
 *
 */
export function decodeMdocDeviceResponse(vpToken: MdocOid4vpMdocVpToken): MdocDeviceResponse {
  const deviceResponse = mdoc.com.sphereon.mdoc.data.device.DeviceResponseCbor.Static.cborDecode(
    mdoc.com.sphereon.kmp.decodeFrom(vpToken, mdoc.com.sphereon.kmp.Encoding.BASE64URL),
  )
  return deviceResponse
}

// TODO naive implementation of mapping a mdoc onto a IVerifiableCredential. Needs some fixes and further implementation and needs to be moved out of ssi-types
export const mdocDecodedCredentialToUniformCredential = (
  decoded: MdocDocument,
  // @ts-ignore
  opts?: { maxTimeSkewInMS?: number },
): IVerifiableCredential => {
  const document = decoded.toJson()
  const json = document.toJsonDTO<DocumentJson>()
  const type = 'Personal Identification Data'
  const MSO = document.MSO
  if (!MSO || !json.issuerSigned?.nameSpaces) {
    throw Error(`Cannot access Mobile Security Object or Issuer Signed items from the Mdoc`)
  }
  const nameSpaces = json.issuerSigned.nameSpaces as unknown as Record<string, IssuerSignedItemJson[]>
  if (!('eu.europa.ec.eudi.pid.1' in nameSpaces)) {
    throw Error(`Only PID supported at present`)
  }
  const items = nameSpaces['eu.europa.ec.eudi.pid.1']
  if (!items || items.length === 0) {
    throw Error(`No issuer signed items were found`)
  }
  type DisclosuresAccumulator = {
    [key: string]: any
  }

  const credentialSubject = items.reduce((acc: DisclosuresAccumulator, item: IssuerSignedItemJson) => {
    if (Array.isArray(item.value)) {
      acc[item.key] = item.value.map((val) => val.value).join(', ')
    } else {
      acc[item.key] = item.value.value
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

  const credential: Omit<IVerifiableCredential, 'issuer' | 'issuanceDate'> = {
    type: [docType], // Mdoc not a W3C VC, so no VerifiableCredential
    '@context': [], // Mdoc has no JSON-LD by default. Certainly not the VC DM1 default context for JSON-LD
    credentialSubject: {
      type,
      ...credentialSubject,
    },
    issuanceDate,
    expirationDate,
    proof: {
      type: IProofType.MdocProof2024,
      created: issuanceDate,
      proofPurpose: IProofPurpose.authentication,
      verificationMethod: json.issuerSigned.issuerAuth.payload,
      mso_mdoc: mdoc.com.sphereon.kmp.encodeTo(decoded.cborEncode(), mdoc.com.sphereon.kmp.Encoding.BASE64URL),
    },
  }

  return credential as IVerifiableCredential
}
