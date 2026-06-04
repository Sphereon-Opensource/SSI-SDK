import mdocPkg from '@sphereon/kmp-mdoc-core'
const { com } = mdocPkg
import { Nullable } from '@sphereon/kmp-mdoc-core'

import { calculateJwkThumbprint, globalCrypto, verifyRawSignature } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  CertificateInfo,
  derToPEM,
  getCertificateInfo,
  getSubjectDN,
  pemOrDerToX509Certificate,
  validateX509CertificateChain,
  X509ValidationResult,
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { JWK } from '@sphereon/ssi-types'
import * as crypto from 'crypto'
import { Certificate, CryptoEngine, setEngine } from 'pkijs'
// @ts-ignore
import { fromString } from 'uint8arrays/from-string'
// @ts-ignore
import { toString as u8aToString } from 'uint8arrays/to-string'
import { IRequiredContext, VerifyCertificateChainArgs } from '../types/ImDLMdoc'

type CoseKeyCbor = mdocPkg.com.sphereon.crypto.cose.CoseKeyCbor
type ICoseKeyCbor = mdocPkg.com.sphereon.crypto.cose.ICoseKeyCbor
type ToBeSignedCbor = mdocPkg.com.sphereon.crypto.cose.ToBeSignedCbor
const CoseJoseKeyMappingService = com.sphereon.crypto.CoseJoseKeyMappingService
type SignatureAlgorithm = mdocPkg.com.sphereon.crypto.generic.SignatureAlgorithm
type ICoseCryptoCallbackJS = mdocPkg.com.sphereon.crypto.ICoseCryptoCallbackJS
type IKey = mdocPkg.com.sphereon.crypto.IKey
type IX509ServiceJS = mdocPkg.com.sphereon.crypto.IX509ServiceJS
type Jwk = mdocPkg.com.sphereon.crypto.jose.Jwk
const KeyInfo = mdocPkg.com.sphereon.crypto.KeyInfo
type X509VerificationProfile = mdocPkg.com.sphereon.crypto.X509VerificationProfile
const DateTimeUtils = mdocPkg.com.sphereon.kmp.DateTimeUtils
type LocalDateTimeKMP = mdocPkg.com.sphereon.kmp.LocalDateTimeKMP
const SignatureAlgorithm = mdocPkg.com.sphereon.crypto.generic.SignatureAlgorithm
const DefaultCallbacks = mdocPkg.com.sphereon.crypto.DefaultCallbacks

// ---------- Minimal CBOR helpers for the kmp-mdoc-core kid-mangling workaround ----------
function toU8(bytes: unknown): Uint8Array {
  if (bytes instanceof Uint8Array) return bytes
  if (ArrayBuffer.isView(bytes)) {
    const v = bytes as ArrayBufferView
    return new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
  }
  if (Array.isArray(bytes)) return Uint8Array.from((bytes as number[]).map((b) => b & 0xff))
  throw new Error('unsupported raw bytes type')
}
function extractIssuerAuthRawParts(rawInput: unknown): { protectedBytes: Uint8Array; payloadBytes: Uint8Array } | undefined {
  const u8 = toU8(rawInput)
  let pos = 0
  const readHead = (): { mt: number; len: number } => {
    const b = u8[pos++]
    const mt = b >> 5
    const info = b & 0x1f
    let len: number
    if (info < 24) len = info
    else if (info === 24) {
      len = u8[pos]
      pos += 1
    } else if (info === 25) {
      len = (u8[pos] << 8) | u8[pos + 1]
      pos += 2
    } else if (info === 26) {
      len = u8[pos] * 0x1000000 + (u8[pos + 1] << 16) + (u8[pos + 2] << 8) + u8[pos + 3]
      pos += 4
    } else throw new Error('unsupported cbor length info ' + info)
    return { mt, len }
  }
  const skip = (): void => {
    const h = readHead()
    switch (h.mt) {
      case 0:
      case 1:
      case 7:
        return
      case 2:
      case 3:
        pos += h.len
        return
      case 4:
        for (let i = 0; i < h.len; i++) skip()
        return
      case 5:
        for (let i = 0; i < h.len * 2; i++) skip()
        return
      case 6:
        skip()
        return
    }
  }
  const readBstr = (): Uint8Array => {
    const h = readHead()
    if (h.mt !== 2) throw new Error('expected bstr, got mt ' + h.mt)
    const out = u8.slice(pos, pos + h.len)
    pos += h.len
    return out
  }
  const readTstr = (): string => {
    const h = readHead()
    if (h.mt !== 3) throw new Error('expected tstr, got mt ' + h.mt)
    const out = new TextDecoder().decode(u8.slice(pos, pos + h.len))
    pos += h.len
    return out
  }
  const outer = readHead()
  if (outer.mt !== 5) return undefined
  for (let i = 0; i < outer.len; i++) {
    const key = readTstr()
    if (key === 'issuerAuth') {
      const arr = readHead()
      if (arr.mt !== 4 || arr.len !== 4) throw new Error('issuerAuth is not a 4-element array')
      const protectedBytes = readBstr()
      skip()
      const payloadBytes = readBstr()
      return { protectedBytes, payloadBytes }
    }
    skip()
  }
  return undefined
}
function encodeBstrHeader(len: number): Uint8Array {
  if (len < 24) return new Uint8Array([0x40 | len])
  if (len < 0x100) return new Uint8Array([0x58, len])
  if (len < 0x10000) return new Uint8Array([0x59, (len >> 8) & 0xff, len & 0xff])
  return new Uint8Array([0x5a, (len >>> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff])
}
function concatU8(parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const p of parts) total += p.length
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}
function buildSig1Structure(protectedBytes: Uint8Array, payloadBytes: Uint8Array): Uint8Array {
  const sig1Label = new Uint8Array([0x6a, 0x53, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x31])
  return concatU8([
    new Uint8Array([0x84]),
    sig1Label,
    encodeBstrHeader(protectedBytes.length),
    protectedBytes,
    new Uint8Array([0x40]),
    encodeBstrHeader(payloadBytes.length),
    payloadBytes,
  ])
}

// Convert a DER-encoded ECDSA signature (SEQUENCE { INTEGER r, INTEGER s }) to the raw fixed-width r||s
// form that COSE_Sign1 requires (each coordinate left-padded to `coordSize`, e.g. 32 bytes for ES256/P-256).
function derEcdsaToRaw(der: Uint8Array, coordSize: number): Uint8Array {
  let offset = 0
  if (der[offset++] !== 0x30) throw new Error('Invalid DER ECDSA signature: missing SEQUENCE tag')
  let seqLen = der[offset++]
  if (seqLen & 0x80) {
    const numBytes = seqLen & 0x7f
    seqLen = 0
    for (let i = 0; i < numBytes; i++) seqLen = (seqLen << 8) | der[offset++]
  }
  const readInt = (): Uint8Array => {
    if (der[offset++] !== 0x02) throw new Error('Invalid DER ECDSA signature: missing INTEGER tag')
    const len = der[offset++]
    let val = der.slice(offset, offset + len)
    offset += len
    let start = 0
    while (start < val.length - 1 && val[start] === 0x00) start++ // strip DER sign/leading zero bytes
    val = val.slice(start)
    if (val.length > coordSize) throw new Error(`Invalid DER ECDSA signature: integer (${val.length}) exceeds ${coordSize}`)
    const out = new Uint8Array(coordSize)
    out.set(val, coordSize - val.length) // left-pad
    return out
  }
  const r = readInt()
  const s = readInt()
  return concatU8([r, s])
}

// The KMS/MUSAP bridge returns the signature as a base64 (or base64url) string. COSE needs raw r||s bytes.
// Normalize to url-safe unpadded base64, decode, and DER->raw-convert when the bytes are a DER ECDSA signature.
function decodeKmsSignatureToRaw(signature: string, coordSize: number): Uint8Array {
  const normalized = signature
    .trim()
    .replace(/\s+/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  const bytes = fromString(normalized, 'base64url') as Uint8Array
  if (bytes.length > coordSize * 2 && bytes[0] === 0x30) {
    return derEcdsaToRaw(bytes, coordSize)
  }
  return bytes
}

// ---------- Minimal CBOR length walker (definite-length items only) ----------
function cborHeader(buf: Uint8Array, off: number): { major: number; headerLen: number; argument: number } {
  const ib = buf[off]
  const major = ib >> 5
  const ai = ib & 0x1f
  if (ai < 24) return { major, headerLen: 1, argument: ai }
  if (ai === 24) return { major, headerLen: 2, argument: buf[off + 1] }
  if (ai === 25) return { major, headerLen: 3, argument: (buf[off + 1] << 8) | buf[off + 2] }
  if (ai === 26) return { major, headerLen: 5, argument: buf[off + 1] * 0x1000000 + (buf[off + 2] << 16) + (buf[off + 3] << 8) + buf[off + 4] }
  if (ai === 27) {
    let v = 0
    for (let i = 1; i <= 8; i++) v = v * 256 + buf[off + i]
    return { major, headerLen: 9, argument: v }
  }
  throw new Error(`unsupported CBOR additional-info ${ai} at offset ${off}`)
}

function cborItemLen(buf: Uint8Array, off: number): number {
  const h = cborHeader(buf, off)
  let total = h.headerLen
  switch (h.major) {
    case 0: // uint
    case 1: // negint
    case 7: // simple/float (null/true/false/floats — argument captured in headerLen)
      break
    case 2: // bstr
    case 3: // tstr
      total += h.argument
      break
    case 4: // array
      for (let i = 0; i < h.argument; i++) total += cborItemLen(buf, off + total)
      break
    case 5: // map
      for (let i = 0; i < h.argument * 2; i++) total += cborItemLen(buf, off + total)
      break
    case 6: // tag (one following item)
      total += cborItemLen(buf, off + total)
      break
    default:
      throw new Error(`unsupported CBOR major type ${h.major}`)
  }
  return total
}

// The bundled kmp-mdoc-core builds the DeviceAuth COSE Sig_structure non-conformantly: per ISO 18013-5 §9.1.3 (and the
// reference impls auth0/mdl + IDK) the signed payload MUST be DeviceAuthenticationBytes = #6.24(bstr .cbor
// ["DeviceAuthentication", [null,null,OpenID4VPHandover], docType, #6.24(bstr .cbor DeviceNameSpaces)]), and the
// Sig_structure payload = bstr(DeviceAuthenticationBytes). kmp omits BOTH tag-24 wrappers (element 4 + the outer one).
// Re-wrap them here so the device signature matches a conformant verifier. (Element 2 = the SessionTranscript
// [null,null,handover] is already produced by the kmp-mdoc-core handover patch.) "Signature1" / protected / external_aad
// are left untouched. Returns the input unchanged if the structure isn't the expected DeviceAuth Sig_structure.
function reconstructMdocDeviceAuthSigStructure(sig: Uint8Array): Uint8Array {
  if (sig[0] !== 0x84) return sig // Sig_structure must be a 4-element array
  let off = 1
  off += cborItemLen(sig, off) // "Signature1"
  off += cborItemLen(sig, off) // protected (bstr)
  off += cborItemLen(sig, off) // external_aad (bstr)
  const payloadStart = off
  const ph = cborHeader(sig, payloadStart)
  if (ph.major !== 2) return sig // payload must be a bstr
  const daStart = payloadStart + ph.headerLen
  const da = sig.subarray(daStart, daStart + ph.argument) // cbor(DeviceAuthentication)
  if (da[0] !== 0x84) return sig // DeviceAuthentication must be a 4-element array
  let d = 1
  d += cborItemLen(da, d) // "DeviceAuthentication"
  d += cborItemLen(da, d) // SessionTranscript ([null,null,handover])
  d += cborItemLen(da, d) // docType
  const e4 = da.subarray(d, d + cborItemLen(da, d)) // deviceNameSpaces (currently un-tagged)
  const e4Tagged = concatU8([new Uint8Array([0xd8, 0x18]), encodeBstrHeader(e4.length), e4]) // #6.24(bstr deviceNameSpaces)
  const daCorrected = concatU8([da.subarray(0, d), e4Tagged])
  const deviceAuthBytes = concatU8([new Uint8Array([0xd8, 0x18]), encodeBstrHeader(daCorrected.length), daCorrected]) // #6.24(bstr DeviceAuthentication)
  const newPayload = concatU8([encodeBstrHeader(deviceAuthBytes.length), deviceAuthBytes]) // bstr(DeviceAuthenticationBytes)
  return concatU8([sig.subarray(0, payloadStart), newPayload])
}

export class CoseCryptoService implements ICoseCryptoCallbackJS {
  constructor(private context?: IRequiredContext) {}

  setContext(context: IRequiredContext) {
    this.context = context
  }

  async signAsync(input: ToBeSignedCbor, requireX5Chain: Nullable<boolean>): Promise<Int8Array> {
    if (!this.context) {
      throw Error('No context provided. Please provide a context with the setContext method or constructor')
    }
    const { keyInfo, alg, value } = input
    // The kmp-mdoc-core Sig_structure omits the ISO 18013-5 §9.1.3 tag-24 wrappers around deviceNameSpaces and the
    // whole DeviceAuthentication. Re-wrap them so the signed bytes match a conformant verifier (auth0/mdl, IDK).
    let toBeSigned: Uint8Array = toU8(value as any)
    try {
      toBeSigned = reconstructMdocDeviceAuthSigStructure(toBeSigned)
    } catch (e: any) {
      console.log(`(mdl-mdoc:sign) Sig_structure tag-24 reconstruction failed, signing kmp original: ${e?.message}`)
    }
    // DIAGNOSTIC: dump the exact COSE Sig_structure (ToBeSigned) the holder signs, so it can be diffed
    // byte-for-byte against the verifier's reconstructed DeviceAuthentication (handover/transcript debugging).
    try {
      let hex = ''
      for (let i = 0; i < toBeSigned.length; i++) hex += (toBeSigned[i] & 0xff).toString(16).padStart(2, '0')
      console.log(`(mdl-mdoc:sign) ToBeSigned len=${toBeSigned.length} hex=${hex}`)
    } catch (e: any) {
      console.log(`(mdl-mdoc:sign) ToBeSigned hex failed: ${e?.message}`)
    }
    let kmsKeyRef = keyInfo.kmsKeyRef ?? undefined
    // Additional key references to try if the primary keyRef is not found in the KMS. The COSE key kid coming from
    // an mdoc deviceKey can be the (mangled) x-coordinate rather than the KMS kid; the KMS can also resolve a key by
    // its JWK thumbprint, so we fall back to that.
    const fallbackKeyRefs: Array<string> = []
    if (!kmsKeyRef) {
      const key = keyInfo.key
      if (key == null) {
        return Promise.reject(Error('No key present in keyInfo. This implementation cannot sign without a key!'))
      }
      const resolvedKeyInfo = com.sphereon.crypto.ResolvedKeyInfo.Static.fromKeyInfo(keyInfo, key)
      const jwkKeyInfo: mdocPkg.com.sphereon.crypto.ResolvedKeyInfo<Jwk> = CoseJoseKeyMappingService.toResolvedJwkKeyInfo(resolvedKeyInfo)

      const thumbprint = calculateJwkThumbprint({ jwk: jwkKeyInfo.key.toJsonDTO() })
      const kid = jwkKeyInfo.kid ?? thumbprint ?? jwkKeyInfo.key.getKidAsString(true)
      if (!kid) {
        return Promise.reject(Error('No kid present and not kmsKeyRef provided'))
      }
      kmsKeyRef = kid
      if (thumbprint && thumbprint !== kid) {
        fallbackKeyRefs.push(thumbprint)
      }
    }
    const doSign = (keyRef: string): Promise<string> =>
      this.context!.agent.keyManagerSign({
        algorithm: alg.jose!!.value,
        // Pass the raw ToBeSigned (COSE Sig_structure) bytes as base64. The previous `encodeTo(value, UTF8)`
        // interpreted the binary CBOR as UTF-8 text, corrupting every non-ASCII byte before the KMS even saw it
        // (the MUSAP bridge then signed the mangled bytes -> verifier "Signature invalid"). base64 round-trips losslessly.
        data: u8aToString(toBeSigned, 'base64'),
        encoding: 'base64',
        keyRef,
      })
    let result: string
    try {
      result = await doSign(kmsKeyRef!!)
    } catch (error) {
      let signed: string | undefined
      for (const ref of fallbackKeyRefs) {
        try {
          signed = await doSign(ref)
          break
        } catch {
          // try the next fallback key reference
        }
      }
      if (signed === undefined) {
        throw error
      }
      result = signed
    }
    // COSE_Sign1 needs the raw fixed-width r||s signature, not the base64(url)/DER form the KMS returns.
    // (Previously this returned `decodeFrom(result, Encoding.UTF8)` — the UTF-8 bytes of the base64 string —
    // which the verifier rejected with "Expected signature size 64, received: 86".)
    const joseAlg = alg.jose?.value
    const coordSize = joseAlg === 'ES512' ? 66 : joseAlg === 'ES384' ? 48 : 32
    const raw = decodeKmsSignatureToRaw(result, coordSize)
    console.log(`(mdl-mdoc:sign) signature decoded: alg=${joseAlg}, inputChars=${result.length}, rawLen=${raw.length} (expected ${coordSize * 2})`)
    return Int8Array.from(raw)
  }

  async verify1Async<CborType>(
    input: mdocPkg.com.sphereon.crypto.cose.CoseSign1Cbor<CborType>,
    keyInfo: mdocPkg.com.sphereon.crypto.IKeyInfo<ICoseKeyCbor>,
    requireX5Chain: Nullable<boolean>,
  ): Promise<mdocPkg.com.sphereon.crypto.generic.IVerifySignatureResult<ICoseKeyCbor>> {
    const getCertAndKey = async (
      x5c: Nullable<Array<string>>,
    ): Promise<{
      issuerCert?: Certificate
      issuerJwk?: Jwk
    }> => {
      if (requireX5Chain && (!x5c || x5c.length === 0)) {
        // We should not be able to get here anyway, as the MLD-mdoc library already validated at this point. But let's make sure
        return Promise.reject(new Error(`No x5chain was present in the CoseSign headers!`))
      }
      // TODO: According to the IETF spec there should be a x5t in case the x5chain is in the protected headers. In the Funke this does not seem to be done/used!
      issuerCert = x5c ? pemOrDerToX509Certificate(x5c[0]) : undefined
      let issuerJwk: Jwk | undefined
      if (issuerCert) {
        const info = await getCertificateInfo(issuerCert)
        issuerJwk = info.publicKeyJWK
      }
      return { issuerCert, issuerJwk }
    }

    const coseKeyInfo = CoseJoseKeyMappingService.toCoseKeyInfo(keyInfo)

    if (coseKeyInfo?.key?.d) {
      throw Error('Do not use private keys to verify!')
    } else if (!input.payload?.value) {
      return Promise.reject(Error('Signature validation without payload not supported'))
    }
    const sign1Json = input.toJson() // Let's make it a bit easier on ourselves, instead of working with CBOR
    const coseAlg = sign1Json.protectedHeader.alg
    if (!coseAlg) {
      return Promise.reject(Error('No alg protected header present'))
    }

    let issuerCert: Certificate | undefined
    let issuerCoseKey: CoseKeyCbor | undefined
    let kid = coseKeyInfo?.kid ?? sign1Json.protectedHeader.kid ?? sign1Json.unprotectedHeader?.kid
    // Please note this method does not perform chain validation. The MDL-MSO_MDOC library already performed this before this step
    const x5c = coseKeyInfo?.key?.getX509CertificateChain() ?? sign1Json.protectedHeader?.x5chain ?? sign1Json.unprotectedHeader?.x5chain
    if (!coseKeyInfo || !coseKeyInfo?.key || coseKeyInfo?.key?.x5chain) {
      const certAndKey = await getCertAndKey(x5c)
      issuerCoseKey = certAndKey.issuerJwk ? CoseJoseKeyMappingService.toCoseKey(certAndKey.issuerJwk) : undefined
      issuerCert = certAndKey.issuerCert
    }
    if (!issuerCoseKey) {
      if (!coseKeyInfo?.key) {
        return Promise.reject(Error(`Either a x5c needs to be in the headers, or you need to provide a key for verification`))
      }
      if (kid === null) {
        kid = coseKeyInfo.key.getKidAsString(false)
      }
      issuerCoseKey = com.sphereon.crypto.cose.CoseKeyCbor.Static.fromDTO(coseKeyInfo.key)
    }

    const issuerCoseKeyInfo = new KeyInfo<CoseKeyCbor>(
      kid,
      issuerCoseKey,
      coseKeyInfo.opts,
      coseKeyInfo.keyVisibility,
      issuerCoseKey.getSignatureAlgorithm() ?? coseKeyInfo.signatureAlgorithm,
      x5c,
      coseKeyInfo.kmsKeyRef,
      coseKeyInfo.kms,
      coseKeyInfo.keyType ?? issuerCoseKey.getKty(),
    )
    const recalculatedToBeSigned = input.toBeSignedJson(issuerCoseKeyInfo, SignatureAlgorithm.Static.fromCose(coseAlg))
    const key = CoseJoseKeyMappingService.toJoseJwk(issuerCoseKeyInfo.key!).toJsonDTO<JWK>()
    let data = fromString(recalculatedToBeSigned.base64UrlValue, 'base64url')
    const signatureBytes = fromString(sign1Json.signature, 'base64url')
    // Workaround: kmp-mdoc-core mangles binary protected-header values (e.g. a bstr kid)
    // by round-tripping them through a UTF-8 String. When the caller stashed the raw mdoc
    // bytes on globalThis (see @sphereon/ssi-sdk.credential-validation cvVerifyMdoc), reparse
    // them here to build the Sig_structure from the untouched protected/payload bstrs, instead
    // of relying on input.toBeSignedJson() which re-encodes the mangled protected header.
    const rawMdocBytes = (globalThis as unknown as { __sphereon_mdoc_raw_bytes?: Uint8Array }).__sphereon_mdoc_raw_bytes
    if (rawMdocBytes) {
      try {
        const extracted = extractIssuerAuthRawParts(rawMdocBytes)
        if (extracted) {
          data = buildSig1Structure(extracted.protectedBytes, extracted.payloadBytes)
        }
      } catch (e) {
        console.warn('[mdl-mdoc verify] failed to reparse raw mdoc; falling back to kmp-computed Sig_structure:', (e as Error).message)
      }
    }
    const valid = await verifyRawSignature({
      data,
      signature: signatureBytes,
      key,
    })

    return {
      name: 'mdoc',
      critical: true,
      error: !valid,
      message: `Signature of '${issuerCert ? getSubjectDN(issuerCert).DN : kid}' was ${valid ? '' : 'in'}valid`,
      keyInfo: issuerCoseKeyInfo,
    } satisfies mdocPkg.com.sphereon.crypto.generic.IVerifySignatureResult<ICoseKeyCbor>
  }

  resolvePublicKeyAsync<KT extends mdocPkg.com.sphereon.crypto.IKey>(
    keyInfo: mdocPkg.com.sphereon.crypto.IKeyInfo<KT>,
  ): Promise<mdocPkg.com.sphereon.crypto.IResolvedKeyInfo<KT>> {
    if (keyInfo.key) {
      return Promise.resolve(CoseJoseKeyMappingService.toResolvedKeyInfo(keyInfo, keyInfo.key))
    }
    return Promise.reject(Error('No key present in keyInfo. This implementation cannot resolve public keys on its own currently!'))
  }
}

/**
 * This class can be used for X509 validations.
 * Either have an instance per trustedCerts and verification invocation or use a single instance and provide the trusted certs in the method argument
 *
 * The class is also registered with the low-level mDL/mdoc Kotlin Multiplatform library
 * Next to the specific function for the library it exports a more powerful version of the same verification method as well
 */
export class X509CallbackService implements IX509ServiceJS {
  private _trustedCerts?: Array<string>

  constructor(trustedCerts?: Array<string>) {
    this.setTrustedCerts(trustedCerts)
  }

  /**
   * A more powerful version of the method below. Allows to verify at a specific time and returns more information
   * @param chain
   * @param trustAnchors
   * @param verificationTime
   */
  async verifyCertificateChain({
    chain,
    trustAnchors = this.getTrustedCerts(),
    verificationTime,
    opts,
  }: VerifyCertificateChainArgs): Promise<X509ValidationResult> {
    return await validateX509CertificateChain({
      chain,
      trustAnchors,
      verificationTime,
      opts,
    })
  }

  /**
   * This method is the implementation used within the mDL/Mdoc library
   */
  async verifyCertificateChainJS<KeyType extends IKey>(
    chainDER: Nullable<Int8Array[]>,
    chainPEM: Nullable<string[]>,
    trustedCerts: Nullable<string[]>,
    verificationProfile?: X509VerificationProfile | undefined,
    verificationTime?: Nullable<LocalDateTimeKMP>,
  ): Promise<mdocPkg.com.sphereon.crypto.IX509VerificationResult<KeyType>> {
    const verificationAt = verificationTime ?? DateTimeUtils.Static.DEFAULT.dateTimeLocal()
    let chain: Array<string | Uint8Array> = []
    if (chainDER && chainDER.length > 0) {
      chain = chainDER.map((der) => Uint8Array.from(der))
    }
    if (chainPEM && chainPEM.length > 0) {
      chain = (chain ?? []).concat(chainPEM)
    }
    const result = await validateX509CertificateChain({
      chain: chain, // The function will handle an empty array
      trustAnchors: trustedCerts ?? this.getTrustedCerts(),
      verificationTime: new Date(verificationAt.toEpochSeconds().toULong() * 1000),
      opts: { trustRootWhenNoAnchors: true },
    })

    const cert: CertificateInfo | undefined = result.certificateChain ? result.certificateChain[result.certificateChain.length - 1] : undefined

    return {
      publicKey: cert?.publicKeyJWK as KeyType, // fixme
      publicKeyAlgorithm: cert?.publicKeyJWK?.alg,
      name: 'x.509',
      critical: result.critical,
      message: result.message,
      error: result.error,
      verificationTime: verificationAt,
    } satisfies mdocPkg.com.sphereon.crypto.IX509VerificationResult<KeyType>
  }

  setTrustedCerts = (trustedCertsInPEM?: Array<string>) => {
    this._trustedCerts = trustedCertsInPEM?.map((cert) => {
      if (cert.includes('CERTIFICATE')) {
        // PEM
        return cert
      }
      return derToPEM(cert)
    })
  }

  getTrustedCerts = () => this._trustedCerts
}

const defaultCryptoEngine = () => {
  // @ts-ignore
  if (typeof self !== 'undefined') {
    // @ts-ignore
    if ('crypto' in self) {
      let engineName = 'webcrypto'
      // @ts-ignore
      if ('webkitSubtle' in self.crypto) {
        engineName = 'safari'
      }
      // @ts-ignore
      setEngine(engineName, new CryptoEngine({ name: engineName, crypto: crypto }))
    }
  } else if (typeof crypto !== 'undefined' && 'webcrypto' in crypto) {
    const name = 'NodeJS ^15'
    const nodeCrypto = crypto.webcrypto
    // @ts-ignore
    setEngine(name, new CryptoEngine({ name, crypto: nodeCrypto }))
  } else {
    // @ts-ignore
    const name = 'crypto'
    setEngine(name, new CryptoEngine({ name, crypto: globalCrypto(false) }))
  }
}

defaultCryptoEngine()

// We register the services with the mDL/mdoc library. Please note that the context is not passed in, meaning we cannot sign by default.
DefaultCallbacks.setCoseCryptoDefault(new CoseCryptoService())
DefaultCallbacks.setX509Default(new X509CallbackService())
