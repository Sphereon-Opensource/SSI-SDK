import { IKey, IAgentContext, IKeyManager } from '@veramo/core'

export function SuppliedSigner(keyRef: Pick<IKey, 'kid'>, context: IAgentContext<IKeyManager>, algorithm: KeyAlgo): Signer {
  return async (data: string | Uint8Array): Promise<string> => {
    const input = data instanceof Object.getPrototypeOf(Uint8Array) ? new TextDecoder().decode(data as Uint8Array) : (data as string)

    return await context.agent.keyManagerSign({ keyRef: keyRef.kid, algorithm, data: input })
  }
}
export declare type Signer = (data: string | Uint8Array) => Promise<EcdsaSignature | string>

export declare enum KeyAlgo {
  EDDSA = 'EdDSA',
  RS256 = 'RS256',
  PS256 = 'PS256',
  ES256 = 'ES256',
  ES256K = 'ES256K',
}
export interface EcdsaSignature {
  r: string
  s: string
  recoveryParam?: number | null
}
