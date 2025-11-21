import { digestMethodParams } from '@sphereon/ssi-sdk-ext.key-utils'
import { HasherSync, JsonWebKey, JWK, Loggers } from '@sphereon/ssi-types'
import { v4 } from 'uuid'
// @ts-ignore
import { fromString } from 'uint8arrays/from-string'
import { IRequiredContext, SdJwtVerifySignature } from './types'

export const defaultGenerateDigest: HasherSync = (data: string | ArrayBuffer | SharedArrayBuffer, alg: string): Uint8Array => {
  return digestMethodParams(alg.includes('256') ? 'SHA-256' : 'SHA-512').hash(
    typeof data === 'string' ? fromString(data, 'utf-8') : new Uint8Array(data),
  )
}

export const defaultGenerateSalt = (): string => {
  return v4()
}

export const defaultVerifySignature =
  (context: IRequiredContext): SdJwtVerifySignature =>
  async (data: string, signature: string, publicKey: JsonWebKey): Promise<boolean> => {
    // The data and signature from the sd-jwt lib are a jwt header.payload and signature, so let's recombine into a compact jwt
    const result = await context.agent.jwtVerifyJwsSignature({ jws: `${data}.${signature}`, jwk: publicKey as JWK })
    Loggers.DEFAULT.get('sd-jwt').info(`SD-JWT signature verified. Result: ${result.message}`)
    return !result.error
  }
