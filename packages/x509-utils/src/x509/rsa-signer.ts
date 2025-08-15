// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString } = u8a
import type { HashAlgorithm, KeyVisibility } from '../types'
import { globalCrypto } from './crypto'
import { cryptoSubtleImportRSAKey, RSAEncryptionSchemes, RSASignatureSchemes } from './rsa-key'
import { PEMToJwk } from './x509-utils'
import type { JsonWebKey } from '@sphereon/ssi-types'
// @ts-ignore
import { CryptoKey, RsaPssParams, AlgorithmIdentifier } from 'node'
export class RSASigner {
  private readonly hashAlgorithm: HashAlgorithm
  private readonly jwk: JsonWebKey

  private key: CryptoKey | undefined
  private readonly scheme: RSAEncryptionSchemes | RSASignatureSchemes

  /**
   *
   * @param key Either in PEM or JWK format (no raw hex keys here!)
   * @param opts The algorithm and signature/encryption schemes
   */
  constructor(
    key: string | JsonWebKey,
    opts?: { hashAlgorithm?: HashAlgorithm; scheme?: RSAEncryptionSchemes | RSASignatureSchemes; visibility?: KeyVisibility }
  ) {
    if (typeof key === 'string') {
      this.jwk = PEMToJwk(key, opts?.visibility)
    } else {
      this.jwk = key
    }

    this.hashAlgorithm = opts?.hashAlgorithm ?? 'SHA-256'
    this.scheme = opts?.scheme ?? 'RSA-PSS'
  }

  private getImportParams(): AlgorithmIdentifier | RsaPssParams {
    if (this.scheme === 'RSA-PSS') {
      return { name: this.scheme, saltLength: 32 }
    }
    return { name: this.scheme /*, hash: this.hashAlgorithm*/ }
  }

  private async getKey(): Promise<CryptoKey> {
    if (!this.key) {
      this.key = await cryptoSubtleImportRSAKey(this.jwk, this.scheme, this.hashAlgorithm)
    }
    return this.key
  }

  private bufferToString(buf: ArrayBuffer) {
    const uint8Array = new Uint8Array(buf)
    return toString(uint8Array, 'base64url') // Needs to be base64url for JsonWebSignature2020. Don't change!
  }

  public async sign(data: Uint8Array): Promise<string> {
    const input = data
    const key = await this.getKey()
    const signature = this.bufferToString(await globalCrypto(false).subtle.sign(this.getImportParams(), key, input))
    if (!signature) {
      throw Error('Could not sign input data')
    }

    //  base64url signature
    return signature
  }

  public async verify(data: string | Uint8Array, signature: string): Promise<boolean> {
    const jws = signature.includes('.') ? signature.split('.')[2] : signature

    const input = typeof data == 'string' ? fromString(data, 'utf-8') : data

    let key = await this.getKey()
    if (!key.usages.includes('verify')) {
      const verifyJwk = { ...this.jwk }
      delete verifyJwk.d
      delete verifyJwk.use
      delete verifyJwk.key_ops
      key = await cryptoSubtleImportRSAKey(verifyJwk, this.scheme, this.hashAlgorithm)
    }
    const verificationResult = await globalCrypto(false).subtle.verify(this.getImportParams(), key, fromString(jws, 'base64url'), input)
    return verificationResult
  }
}
