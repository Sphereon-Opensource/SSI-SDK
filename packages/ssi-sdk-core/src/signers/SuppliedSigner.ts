import { Signer } from '@sphereon/did-auth-siop/dist/main/types/JWT.types'
import { KeyAlgo } from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'
import { IKey, IAgentContext, IKeyManager } from '@veramo/core'

export function SuppliedSigner(keyRef: Pick<IKey, 'kid'>, context: IAgentContext<IKeyManager>, algorithm: KeyAlgo): Signer {
  return async (data: string | Uint8Array): Promise<string> => {
    const input = (data instanceof Object.getPrototypeOf(Uint8Array)) ? new TextDecoder().decode(data as Uint8Array) : data as string;

    return await context.agent.keyManagerSign({keyRef: keyRef.kid, algorithm, data: input})
  }
}
