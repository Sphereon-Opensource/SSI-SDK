import { com, Nullable } from '@sphereon/kmp-mdl-mdoc'
import { CertInfo, derToPEM, validateX509CertificateChain } from '@sphereon/ssi-sdk-ext.x509-utils'
import { X509ValidationResult } from '@sphereon/ssi-sdk-ext.x509-utils/src/x509/x509-validator'
import { VerifyCertificateChainArgs } from '../types/ImDLMdoc'
import CryptoServiceJS = com.sphereon.crypto.CryptoServiceJS
import IX509ServiceJS = com.sphereon.crypto.IX509ServiceJS
import IX509VerificationResult = com.sphereon.crypto.IX509VerificationResult
import X509VerificationProfile = com.sphereon.crypto.X509VerificationProfile
import IKey = com.sphereon.cbor.cose.IKey




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
  async verifyCertificateChain({ chain, trustAnchors = this.getTrustedCerts(), verificationTime }: VerifyCertificateChainArgs): Promise<X509ValidationResult> {
    return await validateX509CertificateChain({
      chain,
      trustAnchors,
      verificationTime,
      opts: { trustRootWhenNoAnchors: true }
    })
  }

  /**
   * This method is the implementation used within the mDL/Mdoc library
   */
  async verifyCertificateChainJS<KeyType extends IKey>(chainDER: Nullable<Int8Array[]>, chainPEM: Nullable<string[]>, trustedCerts: Nullable<string[]>, verificationProfile?: X509VerificationProfile | undefined): Promise<IX509VerificationResult<KeyType>> {
    let chain: Array<string | Uint8Array> = []
    if (chainDER && chainDER.length > 0) {
      chain = chainDER.map(der => Uint8Array.from(der))
    }
    if (chainPEM && chainPEM.length > 0) {
      chain = (chain ?? []).concat(chainPEM)
    }
    const result = await validateX509CertificateChain({
      chain: chain, // The function will handle an empty array
      trustAnchors: trustedCerts ?? this.getTrustedCerts(),
      opts: { trustRootWhenNoAnchors: true }
    })

    const cert: CertInfo | undefined = result.certificateChain ? result.certificateChain[result.certificateChain.length - 1] : undefined

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
    this._trustedCerts = trustedCertsInPEM?.map(cert => {
      if (cert.includes('CERTIFICATE')) {
        // PEM
        return cert
      }
      return derToPEM(cert)
    })
  }

  getTrustedCerts = () => this._trustedCerts
}

// We register this service with the mDL/mdoc library
CryptoServiceJS.X509.register(new X509CallbackService())

