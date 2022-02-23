import { OobPayload, OobQRProps } from '../../types/WaciTypes'
import base64url from 'base64url'

export class OutOfBandMessage {
  public static createPayload(oobQRProps: OobQRProps): OobPayload {
    return {
      type: oobQRProps.type,
      id: oobQRProps.id,
      from: oobQRProps.from,
      body: { ...oobQRProps.body },
    }
  }

  public static toJson(payload: OobPayload): string {
    return JSON.stringify(payload).replace('goalCode', 'goal-code')
  }

  public static urlEncode(payload: OobPayload) {
    return base64url.encode(this.toJson(payload))
  }
}
