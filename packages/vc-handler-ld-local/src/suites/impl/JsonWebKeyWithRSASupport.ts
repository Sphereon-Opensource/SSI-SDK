import { Ed25519KeyPair, Ed25519VerificationKey2018 } from '@transmute/ed25519-key-pair'
import { Secp256k1KeyPair, EcdsaSecp256k1VerificationKey2019 } from '@transmute/secp256k1-key-pair'

import crypto from 'crypto'
import { JWS } from '@transmute/jose-ld'

import { WebCryptoKey, JsonWebKey2020, P256Key2021, P384Key2021, P521Key2021 } from '@transmute/web-crypto-key-pair'

export { JsonWebKey2020 }

const getKeyPairForKtyAndCrv = (kty: string, crv: string) => {
  if (kty === 'OKP') {
    if (crv === 'Ed25519') {
      return Ed25519KeyPair
    }
  }
  if (kty === 'EC') {
    if (crv === 'secp256k1') {
      return Secp256k1KeyPair
    }

    if (['P-256', 'P-384', 'P-521'].includes(crv)) {
      return WebCryptoKey
    }
  }
  if (kty === 'RSA') {
    return WebCryptoKey
  }
  throw new Error(`getKeyPairForKtyAndCrv does not support: ${kty} and ${crv}`)
}

const getKeyPairForType = (k: any) => {
  if (k.type === 'JsonWebKey2020') {
    return getKeyPairForKtyAndCrv(k.publicKeyJwk.kty, k.publicKeyJwk.crv)
  }
  if (k.type === 'RSAVerificationKey2018') {
    return WebCryptoKey
  }
  if (k.type === 'Ed25519VerificationKey2018') {
    return Ed25519KeyPair
  }
  if (k.type === 'EcdsaSecp256k1VerificationKey2019') {
    return Secp256k1KeyPair
  }

  if (['P256Key2021', 'P384Key2021', 'P521Key2021'].includes(k.type)) {
    return WebCryptoKey
  }

  throw new Error('getKeyPairForType does not support type: ' + k.type)
}

const getVerifier = async (k: any, options = { detached: true }) => {
  const { publicKeyJwk } = await k.export({ type: 'JsonWebKey2020' })
  const { kty, crv } = publicKeyJwk
  if (kty === 'OKP') {
    if (crv === 'Ed25519') {
      return JWS.createVerifier(k.verifier('EdDsa'), 'EdDSA', options)
    }
  }

  if (kty === 'RSA') {
    // @ts-ignore
    return JWS.createVerifier(k.verifier('RSA'), 'RS256', options)
  }

  if (kty === 'EC') {
    if (crv === 'secp256k1') {
      return JWS.createVerifier(k.verifier('Ecdsa'), 'ES256K', options)
    }

    if (crv === 'P-256') {
      return JWS.createVerifier(k.verifier('Ecdsa'), 'ES256', options)
    }
    if (crv === 'P-384') {
      return JWS.createVerifier(k.verifier('Ecdsa'), 'ES384', options)
    }
    if (crv === 'P-521') {
      return JWS.createVerifier(k.verifier('Ecdsa'), 'ES512', options)
    }

    if (crv === 'BLS12381_G2') {
      throw new Error('BLS12381_G2 has no registered JWA')
    }
  }

  throw new Error(`getVerifier does not support ${JSON.stringify(publicKeyJwk, null, 2)}`)
}

const getSigner = async (k: any, options = { detached: true }) => {
  const { publicKeyJwk } = await k.export({ type: 'JsonWebKey2020' })
  const { kty, crv } = publicKeyJwk
  if (kty === 'OKP') {
    if (crv === 'Ed25519') {
      return JWS.createSigner(k.signer('EdDsa'), 'EdDSA', options)
    }
  }
  if (kty === 'RSA') {
    // @ts-ignore
    return JWS.createSigner(k.signer('RSA'), 'RS256', options)
  }
  if (kty === 'EC') {
    if (crv === 'secp256k1') {
      return JWS.createSigner(k.signer('Ecdsa'), 'ES256K', options)
    }
    if (crv === 'BLS12381_G2') {
      throw new Error('BLS12381_G2 has no registered JWA')
    }
    if (crv === 'P-256') {
      return JWS.createSigner(k.signer('Ecdsa'), 'ES256', options)
    }
    if (crv === 'P-384') {
      return JWS.createSigner(k.signer('Ecdsa'), 'ES384', options)
    }
    if (crv === 'P-521') {
      return JWS.createSigner(k.signer('Ecdsa'), 'ES512', options)
    }
  }
  throw new Error(`getSigner does not support ${JSON.stringify(publicKeyJwk, null, 2)}`)
}

const applyJwa = async (k: any, options?: any) => {
  const verifier = options?.verifier !== undefined ? options.verifier : await getVerifier(k, options)
  k.verifier = () => verifier as any
  if (k.privateKey || options?.signer !== undefined) {
    const signer = options?.signer !== undefined ? options.signer : await getSigner(k, options)
    k.signer = () => signer as any
  }
  return k
}

// this is dirty...
const useJwa = async (k: any, options?: any) => {
  // before mutation, annotate the apply function....
  k.useJwa = async (options?: any) => {
    return applyJwa(k, options)
  }
  return applyJwa(k, options)
}

export class JsonWebKey {
  public id!: string
  public type!: string
  public controller!: string

  static generate = async (
    options: any = {
      kty: 'OKP',
      crv: 'Ed25519',
      detached: true,
    }
  ) => {
    const KeyPair = getKeyPairForKtyAndCrv(options.kty, options.crv)
    if (!options.secureRandom) {
      options.secureRandom = () => {
        return crypto.randomBytes(32)
      }
    }
    const kp = await KeyPair.generate({
      kty: options.kty,
      crvOrSize: options.crv,
      secureRandom: options.secureRandom,
    })
    const { detached } = options
    return useJwa(kp, { detached })
  }

  static from = async (
    k: JsonWebKey2020 | P256Key2021 | P384Key2021 | P521Key2021 | Ed25519VerificationKey2018 | EcdsaSecp256k1VerificationKey2019,
    options: any = { detached: true }
  ) => {
    const KeyPair = getKeyPairForType(k)
    const kp = await KeyPair.from(k as any)
    let { detached, header, signer, verifier } = options
    if (detached === undefined) {
      detached = true
    }
    return useJwa(kp, { detached, header, signer, verifier })
  }

  public signer!: () => any
  public verifier!: () => any
}
