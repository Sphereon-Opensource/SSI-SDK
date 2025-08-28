import * as mdoc from '@sphereon/kmp-mdoc-core'
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
import { IRequiredContext, VerifyCertificateChainArgs } from '../types/ImDLMdoc'

type CoseKeyCbor = mdoc.com.sphereon.crypto.cose.CoseKeyCbor
type ICoseKeyCbor = mdoc.com.sphereon.crypto.cose.ICoseKeyCbor
type ToBeSignedCbor = mdoc.com.sphereon.crypto.cose.ToBeSignedCbor
const CoseJoseKeyMappingService = mdoc.com.sphereon.crypto.CoseJoseKeyMappingService
type SignatureAlgorithm = mdoc.com.sphereon.crypto.generic.SignatureAlgorithm
type ICoseCryptoCallbackJS = mdoc.com.sphereon.crypto.ICoseCryptoCallbackJS
type IKey = mdoc.com.sphereon.crypto.IKey
type IX509ServiceJS = mdoc.com.sphereon.crypto.IX509ServiceJS
type Jwk = mdoc.com.sphereon.crypto.jose.Jwk
const KeyInfo = mdoc.com.sphereon.crypto.KeyInfo
type X509VerificationProfile = mdoc.com.sphereon.crypto.X509VerificationProfile
const DateTimeUtils = mdoc.com.sphereon.kmp.DateTimeUtils
const decodeFrom = mdoc.com.sphereon.kmp.decodeFrom
const encodeTo = mdoc.com.sphereon.kmp.encodeTo
const Encoding = mdoc.com.sphereon.kmp.Encoding
type LocalDateTimeKMP = mdoc.com.sphereon.kmp.LocalDateTimeKMP
const SignatureAlgorithm = mdoc.com.sphereon.crypto.generic.SignatureAlgorithm
const DefaultCallbacks = mdoc.com.sphereon.crypto.DefaultCallbacks

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
    let kmsKeyRef = keyInfo.kmsKeyRef ?? undefined
    if (!kmsKeyRef) {
      const key = keyInfo.key
      if (key == null) {
        return Promise.reject(Error('No key present in keyInfo. This implementation cannot sign without a key!'))
      }
      const resolvedKeyInfo = mdoc.com.sphereon.crypto.ResolvedKeyInfo.Static.fromKeyInfo(keyInfo, key)
      const jwkKeyInfo: mdoc.com.sphereon.crypto.ResolvedKeyInfo<Jwk> = CoseJoseKeyMappingService.toResolvedJwkKeyInfo(resolvedKeyInfo)

      const kid = jwkKeyInfo.kid ?? calculateJwkThumbprint({ jwk: jwkKeyInfo.key.toJsonDTO() }) ?? jwkKeyInfo.key.getKidAsString(true)
      if (!kid) {
        return Promise.reject(Error('No kid present and not kmsKeyRef provided'))
      }
      kmsKeyRef = kid
    }
    const result = await this.context.agent.keyManagerSign({
      algorithm: alg.jose!!.value,
      data: encodeTo(value, Encoding.UTF8),
      encoding: 'utf-8',
      keyRef: kmsKeyRef!!,
    })
    return decodeFrom(result, Encoding.UTF8)
  }

  async verify1Async<CborType>(
    input: mdoc.com.sphereon.crypto.cose.CoseSign1Cbor<CborType>,
    keyInfo: mdoc.com.sphereon.crypto.IKeyInfo<ICoseKeyCbor>,
    requireX5Chain: Nullable<boolean>,
  ): Promise<mdoc.com.sphereon.crypto.generic.IVerifySignatureResult<ICoseKeyCbor>> {
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
      issuerCoseKey = mdoc.com.sphereon.crypto.cose.CoseKeyCbor.Static.fromDTO(coseKeyInfo.key)
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
    const valid = await verifyRawSignature({
      data: fromString(recalculatedToBeSigned.base64UrlValue, 'base64url'),
      signature: fromString(sign1Json.signature, 'base64url'),
      key,
    })

    return {
      name: 'mdoc',
      critical: true,
      error: !valid,
      message: `Signature of '${issuerCert ? getSubjectDN(issuerCert).DN : kid}' was ${valid ? '' : 'in'}valid`,
      keyInfo: issuerCoseKeyInfo,
    } satisfies mdoc.com.sphereon.crypto.generic.IVerifySignatureResult<ICoseKeyCbor>
  }

  resolvePublicKeyAsync<KT extends mdoc.com.sphereon.crypto.IKey>(
    keyInfo: mdoc.com.sphereon.crypto.IKeyInfo<KT>,
  ): Promise<mdoc.com.sphereon.crypto.IResolvedKeyInfo<KT>> {
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
  ): Promise<mdoc.com.sphereon.crypto.IX509VerificationResult<KeyType>> {
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
    } satisfies mdoc.com.sphereon.crypto.IX509VerificationResult<KeyType>
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
