import { com, Nullable } from '@sphereon/kmp-mdoc-core'
import {
  CertificateInfo,
  derToPEM,
  getSubjectDN,
  pemOrDerToX509Certificate,
  validateX509CertificateChain,
  X509ValidationResult
} from '@sphereon/ssi-sdk-ext.x509-utils'
import * as crypto from 'crypto'
import { Certificate, CryptoEngine, setEngine } from 'pkijs'
import { VerifyCertificateChainArgs } from '../types/ImDLMdoc'
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
import X509VerificationProfile = com.sphereon.crypto.X509VerificationProfile
import decodeFrom = com.sphereon.kmp.decodeFrom
import Encoding = com.sphereon.kmp.Encoding

export class CoseCryptoService implements ICoseCryptoCallbackJS {
  async signAsync<CborType>(input: ToBeSignedCbor, requireX5Chain: Nullable<boolean>): Promise<Int8Array> {
    throw new Error('Method not implemented.')
  }

  async verify1Async<CborType>(input: CoseSign1Cbor<CborType>, keyInfo: IKeyInfo<ICoseKeyCbor>, requireX5Chain: Nullable<boolean>): Promise<IVerifySignatureResult<ICoseKeyCbor>> {
    const getCertAndKey = async (x5c: Nullable<Array<string>>): Promise<{
      issuerCert?: Certificate
      issuerPublicKey: CryptoKey
    }> => {
      if (requireX5Chain && (!x5c || x5c.length === 0)) {
        // We should not be able to get here anyway, as the MLD-mdoc library already validated at this point. But let's make sure
        return Promise.reject(new Error(`No x5chain was present in the CoseSign headers!`))
      }
      // TODO: According to the IETF spec there should be a x5t in case the x5chain is in the protected headers. In the Funke this does not seem to be done/used!
      issuerCert = x5c ? pemOrDerToX509Certificate(x5c[0]) : undefined
      if (issuerCert) {
        issuerPublicKey = await issuerCert.getPublicKey()
      }
      return { issuerCert, issuerPublicKey }
    }

    if (keyInfo?.key?.d) {
      throw Error('Do not use private keys to verify!')
    } else if (!input.payload?.value) {
      return Promise.reject(Error('Signature validation without payload not supported'))
    }
    const sign1Json = input.toJson() // Let's make it a bit easier on ourselves, instead of working with CBOR
    const coseAlg = sign1Json.protectedHeader.alg
    if (!coseAlg) {
      return Promise.reject(Error('No alg protected header present'))
    }

    let issuerPublicKey: CryptoKey
    let issuerCert: Certificate | undefined
    let kid = keyInfo?.kid ?? sign1Json.protectedHeader.kid ?? sign1Json.unprotectedHeader?.kid
    // Please note this method does not perform chain validation. The MDL-MSO_MDOC library already performed this before this step
    const x5c = keyInfo?.key?.getX509CertificateChain() ??
      sign1Json.protectedHeader?.x5chain ??
      sign1Json.unprotectedHeader?.x5chain
    if (!keyInfo || !keyInfo?.key || keyInfo?.key?.x5chain) {
      const certAndKey = await getCertAndKey(x5c)
      issuerPublicKey = certAndKey.issuerPublicKey
      issuerCert = certAndKey.issuerCert
    } else {
      const jwkKeyInfo = CoseJoseKeyMappingService.toJwkKeyInfo(keyInfo)
      if (!jwkKeyInfo?.key) {
        return Promise.reject(Error(`Either a x5c needs to be in the headers, or you need to provide a key for verification`))
      }
      const jwk = jwkKeyInfo.key
      if (kid === null) {
        kid = jwk.kid
      }
      let keyAlg = jwk.kty ?? 'ECDSA'
      const crv: string = jwk.crv?.value ?? 'P-256'
      issuerPublicKey = await crypto.subtle.importKey(
        'jwk',
        {
          kty: jwk.kty.value,
          crv,
          ...(jwk.x5c && { x5c: jwk.x5c }),
          ...(jwk.x && { x: jwk.x }),
          ...(jwk.y && { y: jwk.y })
        } satisfies JsonWebKey,
        {
          name: keyAlg.value === 'EC' ? 'ECDSA' : keyAlg.value,
          namedCurve: crv
        },
        true,
        ['verify']
      )
    }

    const exportedJwk = await crypto.subtle.exportKey('jwk', issuerPublicKey)
    const crv = exportedJwk.crv
    const coseKey = Jwk.Static.fromDTO(exportedJwk).jwkToCoseKeyJson()
    const coseKeyInfo = CoseJoseKeyMappingService.toCoseKeyInfo(keyInfo ?? new KeyInfo<CoseKeyCbor>(kid, coseKey.toCbor()))
    const recalculatedToBeSigned = input.toBeSignedJson(coseKeyInfo, SignatureAlgorithm.Static.fromCose(coseAlg))
    const valid = await crypto.subtle.verify(
      {
        ...issuerPublicKey.algorithm,
        hash: crv?.includes('-') ? `SHA-${crv.split('-')[1]}` : 'SHA-256' // todo: this needs to be more robust
      },
      issuerPublicKey,
      decodeFrom(sign1Json.signature, Encoding.BASE64URL),
      decodeFrom(recalculatedToBeSigned.base64UrlValue, Encoding.BASE64URL)
    )

    return {
      name: 'mdoc',
      critical: true,
      error: !valid,
      message: `Signature of '${issuerCert ? getSubjectDN(issuerCert).DN : kid}' was ${valid ? '' : 'in'}valid`,
      keyInfo: coseKeyInfo
    } satisfies IVerifySignatureResult<ICoseKeyCbor>
  }

  resolvePublicKeyAsync<KT extends com.sphereon.crypto.IKey>(keyInfo: com.sphereon.crypto.IKeyInfo<KT>): Promise<com.sphereon.crypto.IResolvedKeyInfo<KT>> {
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
    verificationProfile?: X509VerificationProfile | undefined
  ): Promise<IX509VerificationResult<KeyType>> {
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
      opts: { trustRootWhenNoAnchors: true }
    })

    const cert: CertificateInfo | undefined = result.certificateChain ? result.certificateChain[result.certificateChain.length - 1] : undefined

    return {
      publicKey: cert?.publicKeyJWK as KeyType, // fixme
      publicKeyAlgorithm: cert?.publicKeyJWK?.alg,
      name: 'x.509',
      critical: result.critical,
      message: result.message,
      error: result.error
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
    if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
      const name = 'crypto'
      setEngine(name, new CryptoEngine({ name, crypto: crypto }))
    }
  }
}

defaultCryptoEngine()

// We register the services with the mDL/mdoc library
DefaultCallbacks.setCoseCryptoDefault(new CoseCryptoService())
DefaultCallbacks.setX509Default(new X509CallbackService())
