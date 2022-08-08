import crypto from 'crypto'
import { IContext } from './types/ion-provider-types'
import * as u8a from 'uint8arrays'
import base64url from 'base64url'
import { truncateKidIfNeeded } from './functions'

export class IonSigner {
  private readonly kid: string
  constructor(private context: IContext, kid: string) {
    this.kid = truncateKidIfNeeded(kid)
  }

  async sign(header: any, content: any): Promise<string> {
    if (!header) {
      header = {
        alg: 'ES256K',
      }
    }
    const encodedHeader = base64url.encode(JSON.stringify(header))
    const encodedPayload = base64url.encode(JSON.stringify(content))
    const toBeSigned = encodedHeader + '.' + encodedPayload
    const message = u8a.fromString(toBeSigned)
    const digest = crypto.createHash('sha256').update(message).digest('binary')
    const sigObj = await this.context.agent.keyManagerSign({ keyRef: this.kid, algorithm: header.alg, data: digest })
    const encodedSignature = sigObj // The keyManagerSign already performs base64Url encoding
    return encodedHeader + '.' + encodedPayload + '.' + encodedSignature
  }
}
