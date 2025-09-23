/**
 * Create some interface below to do a the mapping of the KMP library.
 * For now we are using the library directly, and thus do not need them,
 * but it would be nice if we can remove the imports and just have some interfaces here we can then use, like done
 * for sd-jwts
 */
import mdocPkg from '@sphereon/kmp-mdoc-core'
import { OriginalType } from '../mapper'

export type DocumentJson = mdocPkg.com.sphereon.mdoc.data.device.DocumentJson
export type IssuerSignedItemJson = mdocPkg.com.sphereon.mdoc.data.device.IssuerSignedItemJson

/**
 * Represents a selective disclosure JWT vc in compact form.
 */
export type MdocOid4vpIssuerSigned = string
export type MdocOid4vpMdocVpToken = string
export type MdocIssuerSigned = mdocPkg.com.sphereon.mdoc.data.device.IssuerSignedCbor
export type MdocDocument = mdocPkg.com.sphereon.mdoc.data.device.DocumentCbor
export type MdocDocumentJson = mdocPkg.com.sphereon.mdoc.data.device.DocumentJson
export type IssuerSignedJson = mdocPkg.com.sphereon.mdoc.data.device.IssuerSignedJson
export type DeviceSignedJson = mdocPkg.com.sphereon.mdoc.data.device.DeviceSignedJson
export type MdocDeviceResponse = mdocPkg.com.sphereon.mdoc.data.device.DeviceResponseCbor

export interface WrappedMdocCredential {
  /**
   * Original IssuerSigned to Mdoc that we've received. Can be either the encoded or decoded variant.
   */
  original: MdocDocument | MdocOid4vpIssuerSigned
  /**
   * Record where keys are the namespaces and the values are objects again with the namespace values
   * @todo which types can be there? (it doesn't matter for matching as mdoc only matches on path)
   */
  decoded: MdocDecodedPayload
  /**
   * Type of this credential.
   */
  type: OriginalType.MSO_MDOC_DECODED | OriginalType.MSO_MDOC_ENCODED
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: 'mso_mdoc'
  /**
   * Internal stable representation of a Credential
   */
  credential: MdocDocument
}

export interface WrappedMdocPresentation {
  /**
   * Original VP that we've received. Can be either the encoded or decoded variant.
   */
  original: MdocDeviceResponse | MdocOid4vpMdocVpToken
  /**
   * Decoded version of the SD-JWT payload. This is the decoded payload, rather than the whole SD-JWT.
   */
  decoded: MdocDeviceResponse
  /**
   * Type of this Presentation.
   */
  type: OriginalType.MSO_MDOC_ENCODED | OriginalType.MSO_MDOC_DECODED
  /**
   * The claim format, typically used during exchange transport protocols
   */
  format: 'mso_mdoc'
  /**
   * Internal stable representation of a Presentation
   */
  presentation: MdocDeviceResponse
  /**
   * Wrapped Mdocs belonging to the Presentation. There can be multiple
   * documents in a single device response
   */
  vcs: WrappedMdocCredential[]
}

/**
 * Record where keys are the namespaces and the values are objects again with the namespace values
 */
export type MdocDecodedPayload = Record<string, Record<string, string | number | boolean>>
