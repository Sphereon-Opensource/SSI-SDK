import { DIDCommV2OOBInvitation } from '../../types/IQRCodeGenerator'
import base64url from 'base64url'

export class DidCommOutOfBandMessage {
  public static toJson(props: DIDCommV2OOBInvitation): string {
    return JSON.stringify(props).replace('goalCode', 'goal-code')
  }

  public static urlEncode(payload: DIDCommV2OOBInvitation) {
    return base64url(this.toJson(payload))
  }
}
