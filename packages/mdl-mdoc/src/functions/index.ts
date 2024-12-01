import { com, Nullable } from '@sphereon/kmp-mdoc-core'
import { globalCrypto, verifyRawSignature } from '@sphereon/ssi-sdk-ext.key-utils'
import {
  CertificateInfo,
  derToPEM,
  getCertificateInfo,
  getSubjectDN,
  pemOrDerToX509Certificate,
  validateX509CertificateChain,
  X509ValidationResult
} from '@sphereon/ssi-sdk-ext.x509-utils'
import { JWK } from '@sphereon/ssi-types'
import * as crypto from 'crypto'
import { Certificate, CryptoEngine, setEngine } from 'pkijs'
import * as u8a from 'uint8arrays'
import { IRequiredContext, VerifyCertificateChainArgs } from '../types/ImDLMdoc'
import CoseKeyCbor = com.sphereon.crypto.cose.CoseKeyCbor
import CoseSign1Cbor = com.sphereon.crypto.cose.CoseSign1Cbor
import ICoseKeyCbor = com.sphereon.crypto.cose.ICoseKeyCbor
import ToBeSignedCbor = com.sphereon.crypto.cose.ToBeSignedCbor
import CoseJoseKeyMappingService = com.sphereon.crypto.CoseJoseKeyMappingService
import DefaultCallbacks = com.sphereon.crypto.DefaultCallbacks
import IVerifySignatureResult = com.sphereon.crypto.generic.IVerifySignatureResult
import SignatureAlgorithm = com.sphereon.crypto.generic.SignatureAlgorithm
import ICoseCryptoCallbackJS = com.sphereon.crypto.ICoseCryptoCallbackJS
import IKey = com.sphereon.crypto.IKey
import IKeyInfo = com.sphereon.crypto.IKeyInfo
import IX509ServiceJS = com.sphereon.crypto.IX509ServiceJS
import IX509VerificationResult = com.sphereon.crypto.IX509VerificationResult
import Jwk = com.sphereon.crypto.jose.Jwk
import KeyInfo = com.sphereon.crypto.KeyInfo
import ResolvedKeyInfo = com.sphereon.crypto.ResolvedKeyInfo
import X509VerificationProfile = com.sphereon.crypto.X509VerificationProfile
import DateTimeUtils = com.sphereon.kmp.DateTimeUtils
import decodeFrom = com.sphereon.kmp.decodeFrom
import encodeTo = com.sphereon.kmp.encodeTo
import Encoding = com.sphereon.kmp.Encoding
import LocalDateTimeKMP = com.sphereon.kmp.LocalDateTimeKMP

export class CoseCryptoService implements ICoseCryptoCallbackJS {
  constructor(private context?: IRequiredContext) {
  }

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
      const resolvedKeyInfo = ResolvedKeyInfo.Static.fromKeyInfo(keyInfo, key)
      const jwkKeyInfo: ResolvedKeyInfo<Jwk> = CoseJoseKeyMappingService.toResolvedJwkKeyInfo(resolvedKeyInfo)
      const kid = jwkKeyInfo.kid ?? key.getKidAsString(true) ?? undefined
      if (!kid) {
        return Promise.reject(Error('No kid present'))
      }
      kmsKeyRef = kid
    }
    const result = await this.context.agent.keyManagerSign({
      algorithm: alg.jose!!.value,
      data: encodeTo(value, Encoding.UTF8),
      encoding: 'utf-8',
      keyRef: kmsKeyRef!!
    })
    return decodeFrom(result, Encoding.UTF8)
  }

  async verify1Async<CborType>(
    input: CoseSign1Cbor<CborType>,
    keyInfo: IKeyInfo<ICoseKeyCbor>,
    requireX5Chain: Nullable<boolean>
  ): Promise<IVerifySignatureResult<ICoseKeyCbor>> {
    const getCertAndKey = async (
      x5c: Nullable<Array<string>>
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
      issuerCoseKey = CoseKeyCbor.Static.fromDTO(coseKeyInfo.key)
    }

    const issuerCoseKeyInfo = new KeyInfo<CoseKeyCbor>(kid, issuerCoseKey, coseKeyInfo.opts, coseKeyInfo.keyVisibility, issuerCoseKey.getSignatureAlgorithm() ?? coseKeyInfo.signatureAlgorithm, x5c, coseKeyInfo.kmsKeyRef, coseKeyInfo.kms, coseKeyInfo.keyType ?? issuerCoseKey.getKty())
    const recalculatedToBeSigned = input.toBeSignedJson(issuerCoseKeyInfo, SignatureAlgorithm.Static.fromCose(coseAlg))
    const key = CoseJoseKeyMappingService.toJoseJwk(issuerCoseKeyInfo.key!).toJsonDTO<JWK>()
    const valid = await verifyRawSignature({
      data: u8a.fromString(recalculatedToBeSigned.base64UrlValue, 'base64url'),
      signature: u8a.fromString(sign1Json.signature, 'base64url'),
      key
    })


    return {
      name: 'mdoc',
      critical: true,
      error: !valid,
      message: `Signature of '${issuerCert ? getSubjectDN(issuerCert).DN : kid}' was ${valid ? '' : 'in'}valid`,
      keyInfo: issuerCoseKeyInfo
    } satisfies IVerifySignatureResult<ICoseKeyCbor>
  }

  resolvePublicKeyAsync<KT extends com.sphereon.crypto.IKey>(
    keyInfo: com.sphereon.crypto.IKeyInfo<KT>
  ): Promise<com.sphereon.crypto.IResolvedKeyInfo<KT>> {
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
                                 opts
                               }: VerifyCertificateChainArgs): Promise<X509ValidationResult> {
    return await validateX509CertificateChain({
      chain,
      trustAnchors,
      verificationTime,
      opts
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
    verificationTime?: Nullable<LocalDateTimeKMP>
  ): Promise<IX509VerificationResult<KeyType>> {
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
      opts: { trustRootWhenNoAnchors: true }
    })

    const cert: CertificateInfo | undefined = result.certificateChain ? result.certificateChain[result.certificateChain.length - 1] : undefined

    return {
      publicKey: cert?.publicKeyJWK as KeyType, // fixme
      publicKeyAlgorithm: cert?.publicKeyJWK?.alg,
      name: 'x.509',
      critical: result.critical,
      message: result.message,
      error: result.error,
      verificationTime: verificationAt
    } satisfies IX509VerificationResult<KeyType>
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
  if (typeof self !== 'undefined') {
    if ('crypto' in self) {
      let engineName = 'webcrypto'
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
