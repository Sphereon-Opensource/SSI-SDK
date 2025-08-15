import { defaultRandomSource, randomBytes, type RandomSource } from '@stablelib/random'
import { base64ToBytes, bytesToBase64url, decodeBase64url } from '@veramo/utils'
import * as jose from 'jose'
import type { JWEKeyManagementHeaderParameters, JWTDecryptOptions } from 'jose'
// // @ts-ignore
// import type { KeyLike } from 'jose/dist/types/types'
export type KeyLike = { type: string }
// @ts-ignore
import * as u8a from 'uint8arrays'
const { fromString, toString, concat } = u8a
import {
  type JweAlg,
  JweAlgs,
  type JweEnc,
  JweEncs,
  type JweHeader,
  type JweJsonGeneral,
  type JweProtectedHeader,
  type JweRecipient,
  type JweRecipientUnprotectedHeader,
  type JwsPayload,
} from '../types/IJwtService'

export interface EncryptionResult {
  ciphertext: Uint8Array
  tag: Uint8Array
  iv: Uint8Array
  protectedHeader?: string
  recipients?: JweRecipient[]
  cek?: Uint8Array
}

export const generateContentEncryptionKey = async ({
  alg,
  randomSource = defaultRandomSource,
}: {
  alg: JweEnc
  randomSource?: RandomSource
}): Promise<Uint8Array> => {
  let length: number
  switch (alg) {
    case 'A128GCM':
      length = 16
      break
    case 'A192GCM':
      length = 24
      break
    case 'A128CBC-HS256':
    case 'A256GCM':
      length = 32
      break
    case 'A192CBC-HS384':
      length = 48
      break
    case 'A256CBC-HS512':
      length = 64
      break
    default:
      length = 32
  }
  return randomBytes(length, randomSource)
}

/*
export const generateContentEncryptionKeyfdsdf = async ({type = 'Secp256r1', ...rest}: {
    type?: Extract<TKeyType, 'Secp256r1' | 'RSA'>,
    kms?: string
}, context: IAgentContext<ISphereonKeyManager>): Promise<EphemeralPublicKey> => {

    const kms = rest.kms ?? await context.agent.keyManagerGetDefaultKeyManagementSystem()
    const key = await context.agent.keyManagerCreate({kms, type, opts: {ephemeral: true}})
    const jwk = toJwkFromKey(key, {use: JwkKeyUse.Encryption, noKidThumbprint: true})
}
*/
export interface JwtEncrypter {
  alg: string
  enc: string
  encrypt: (payload: JwsPayload, protectedHeader: JweProtectedHeader, aad?: Uint8Array) => Promise<EncryptionResult>
  encryptCek?: (cek: Uint8Array) => Promise<JweRecipient>
}

export interface JweEncrypter {
  alg: string
  enc: string
  encrypt: (payload: Uint8Array, protectedHeader: JweProtectedHeader, aad?: Uint8Array) => Promise<EncryptionResult>
  encryptCek?: (cek: Uint8Array) => Promise<JweRecipient>
}

export interface JweDecrypter {
  alg: string
  enc: string
  decrypt: (sealed: Uint8Array, iv: Uint8Array, aad?: Uint8Array, recipient?: JweRecipient) => Promise<Uint8Array | null>
}

function jweAssertValid(jwe: JweJsonGeneral) {
  if (!(jwe.protected && jwe.iv && jwe.ciphertext && jwe.tag)) {
    throw Error('JWE is missing properties: protected, iv, ciphertext and/or tag')
  }
  if (jwe.recipients) {
    jwe.recipients.map((recipient: JweRecipient) => {
      if (!(recipient.header && recipient.encrypted_key)) {
        throw Error('Malformed JWE recipients; no header and encrypted key present')
      }
    })
  }
}

function jweEncode({
  ciphertext,
  tag,
  iv,
  protectedHeader,
  recipients,
  aad,
  unprotected,
}: EncryptionResult & {
  aad?: Uint8Array
  unprotected?: JweHeader
}): JweJsonGeneral {
  if (!recipients || recipients.length === 0) {
    throw Error(`No recipient found`)
  }
  return {
    ...(unprotected && { unprotected }),
    protected: <string>protectedHeader,
    iv: bytesToBase64url(iv),
    ciphertext: bytesToBase64url(ciphertext),
    ...(tag && { tag: bytesToBase64url(tag) }),
    ...(aad && { aad: bytesToBase64url(aad) }),
    recipients,
  } satisfies JweJsonGeneral
}

export class CompactJwtEncrypter implements JweEncrypter {
  private _alg: JweAlg | undefined
  private _enc: JweEnc | undefined
  private _keyManagementParams: JWEKeyManagementHeaderParameters | undefined
  private recipientKey: Uint8Array | jose.KeyLike //,EphemeralPublicKey | BaseJWK;
  private expirationTime
  private issuer: string | undefined
  private audience: string | string[] | undefined

  constructor(args: {
    key: Uint8Array | jose.KeyLike /*EphemeralPublicKey | BaseJWK*/
    alg?: JweAlg
    enc?: JweEnc
    keyManagementParams?: JWEKeyManagementHeaderParameters
    expirationTime?: number | string | Date
    issuer?: string
    audience?: string | string[]
  }) {
    if (args?.alg) {
      this._alg = args.alg
    }
    if (args?.enc) {
      this._enc = args.enc
    }
    this._keyManagementParams = args.keyManagementParams
    this.recipientKey = args.key
    this.expirationTime = args.expirationTime
    this.issuer = args.issuer
    this.audience = args.audience
  }

  get enc(): string {
    if (!this._enc) {
      throw Error(`enc not set`)
    }
    return this._enc
  }

  set enc(value: JweEnc | string) {
    // @ts-ignore
    if (!JweEncs.includes(value)) {
      throw Error(`invalid JWE enc value ${value}`)
    }
    this._enc = value as JweEnc
  }

  get alg(): string {
    if (!this._alg) {
      throw Error(`alg not set`)
    }
    return this._alg
  }

  set alg(value: JweAlg | string) {
    // @ts-ignore
    if (!JweAlgs.includes(value)) {
      throw Error(`invalid JWE alg value ${value}`)
    }
    this._alg = value as JweAlg
  }

  async encryptCompactJWT(payload: JwsPayload, jweProtectedHeader: JweProtectedHeader, aad?: Uint8Array | undefined): Promise<string> {
    const protectedHeader = {
      ...jweProtectedHeader,
      alg: jweProtectedHeader.alg ?? this._alg,
      enc: jweProtectedHeader.enc ?? this._enc,
    }
    if (!protectedHeader.alg || !protectedHeader.enc) {
      return Promise.reject(Error(`no 'alg' or 'enc' value set for the protected JWE header!`))
    }
    this.enc = protectedHeader.enc
    this.alg = protectedHeader.alg
    if (payload.exp) {
      this.expirationTime = payload.exp
    }
    if (payload.iss) {
      this.issuer = payload.iss
    }
    if (payload.aud) {
      this.audience = payload.aud
    }
    const encrypt = new jose.EncryptJWT(payload).setProtectedHeader({
      ...protectedHeader,
      alg: this.alg,
      enc: this.enc,
    })
    if (this._alg!.startsWith('ECDH')) {
      if (!this._keyManagementParams) {
        return Promise.reject(Error(`ECDH requires key management params`))
      }
      encrypt.setKeyManagementParameters(this._keyManagementParams!)
    }
    if (this.expirationTime !== undefined) {
      encrypt.setExpirationTime(this.expirationTime)
    }

    if (this.issuer) {
      encrypt.setIssuer(this.issuer)
    }
    if (this.audience) {
      encrypt.setAudience(this.audience)
    }
    return await encrypt.encrypt(this.recipientKey)
  }

  public static async decryptCompactJWT(jwt: string, key: KeyLike | Uint8Array, options?: JWTDecryptOptions) {
    return await jose.jwtDecrypt(jwt, key, options)
  }

  async encrypt(payload: Uint8Array, jweProtectedHeader: JweProtectedHeader, aad?: Uint8Array | undefined): Promise<EncryptionResult> {
    const jwt = await this.encryptCompactJWT(JSON.parse(toString(payload)), jweProtectedHeader, aad)
    const [protectedHeader, encryptedKey, ivB64, payloadB64, tagB64] = jwt.split('.')
    //[jwe.protected, jwe.encrypted_key, jwe.iv, jwe.ciphertext, jwe.tag].join('.');
    console.log(`FIXME: TO EncryptionResult`)

    return {
      protectedHeader,
      tag: base64ToBytes(tagB64),
      ciphertext: base64ToBytes(payloadB64),
      iv: base64ToBytes(ivB64),
      recipients: [
        {
          //fixme
          // header: protectedHeader,
          ...(encryptedKey && { encrypted_key: encryptedKey }),
        },
      ],
    }
  }

  // encryptCek?: ((cek: Uint8Array) => Promise<JweRecipient>) | undefined;
}

export async function createJwe(
  cleartext: Uint8Array,
  encrypters: JweEncrypter[],
  protectedHeader: JweProtectedHeader,
  aad?: Uint8Array
): Promise<JweJsonGeneral> {
  if (encrypters.length === 0) {
    throw Error('JWE needs at least 1 encryptor')
  }
  if (encrypters.find((enc) => enc.alg === 'dir' || enc.alg === 'ECDH-ES')) {
    if (encrypters.length !== 1) {
      throw Error(`JWE can only do "dir" or "ECDH-ES" encryption with one key. ${encrypters.length} supplied`)
    }
    const encryptionResult = await encrypters[0].encrypt(cleartext, protectedHeader, aad)
    return jweEncode({ ...encryptionResult, aad })
  } else {
    const tmpEnc = encrypters[0].enc
    if (!encrypters.reduce((acc, encrypter) => acc && encrypter.enc === tmpEnc, true)) {
      throw new Error('invalid_argument: Incompatible encrypters passed')
    }
    let cek: Uint8Array | undefined = undefined
    let jwe: JweJsonGeneral | undefined = undefined
    for (const encrypter of encrypters) {
      if (!cek) {
        const encryptionResult = await encrypter.encrypt(cleartext, protectedHeader, aad)
        cek = encryptionResult.cek
        jwe = jweEncode({ ...encryptionResult, aad })
      } else {
        const recipient = await encrypter.encryptCek?.(cek)
        if (recipient) {
          jwe?.recipients?.push(recipient)
        }
      }
    }
    if (!jwe) {
      throw Error(`No JWE constructed`)
    }
    return jwe
  }
}

/**
 * Merges all headers, so we get a unified header.
 *
 * @param protectedHeader
 * @param unprotectedHeader
 * @param recipientUnprotectedHeader
 */
export function jweMergeHeaders({
  protectedHeader,
  unprotectedHeader,
  recipientUnprotectedHeader,
}: {
  protectedHeader?: JweProtectedHeader
  unprotectedHeader?: JweHeader
  recipientUnprotectedHeader?: JweRecipientUnprotectedHeader
}): JweHeader {
  // TODO: Check that all headers/params are disjoint!
  const header = { ...protectedHeader, ...unprotectedHeader, ...recipientUnprotectedHeader }

  if (!header.alg || !header.enc) {
    throw Error(`Either 'alg' or 'enc' are missing from the headers`)
  }
  return header as JweHeader
}

export async function decryptJwe(jwe: JweJsonGeneral, decrypter: JweDecrypter): Promise<Uint8Array> {
  jweAssertValid(jwe)
  const protectedHeader: JweProtectedHeader = JSON.parse(decodeBase64url(jwe.protected))
  if (protectedHeader?.enc !== decrypter.enc) {
    return Promise.reject(Error(`Decrypter enc '${decrypter.enc}' does not support header enc '${protectedHeader.enc}'`))
  } else if (!jwe.tag) {
    return Promise.reject(Error(`Decrypter enc '${decrypter.enc}' does not support header enc '${protectedHeader.enc}'`))
  }
  const sealed = toWebCryptoCiphertext(jwe.ciphertext, jwe.tag)
  const aad = fromString(jwe.aad ? `${jwe.protected}.${jwe.aad}` : jwe.protected)
  let cleartext = null
  if (protectedHeader.alg === 'dir' && decrypter.alg === 'dir') {
    cleartext = await decrypter.decrypt(sealed, base64ToBytes(jwe.iv), aad)
  } else if (!jwe.recipients || jwe.recipients.length === 0) {
    throw Error('missing recipients for JWE')
  } else {
    for (let i = 0; !cleartext && i < jwe.recipients.length; i++) {
      const recipient: JweRecipient = jwe.recipients[i]
      recipient.header = { ...recipient.header, ...protectedHeader } as JweRecipientUnprotectedHeader
      if (recipient.header.alg === decrypter.alg) {
        cleartext = await decrypter.decrypt(sealed, base64ToBytes(jwe.iv), aad, recipient)
      }
    }
  }
  if (cleartext === null) throw new Error('failure: Failed to decrypt')
  return cleartext
}

export function toWebCryptoCiphertext(ciphertext: string, tag: string): Uint8Array {
  return concat([base64ToBytes(ciphertext), base64ToBytes(tag)])
}
