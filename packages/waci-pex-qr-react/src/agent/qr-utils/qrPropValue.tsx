import { RP } from '@sphereon/did-auth-siop'
import { SsiQrCodeProps } from '../../types/ssiQrCodeProviderTypes'
import { SIOP } from '@sphereon/did-auth-siop'

export class QrPropValue {
  public static qrValue(ssiQrCodeProps: SsiQrCodeProps): Promise<string> {
    let rp = RP.fromRequestOpts(ssiQrCodeProps.authenticationRequestOpts)

    return rp
      .createAuthenticationRequest({
        state: ssiQrCodeProps.authenticationRequestOpts.state,
        nonce: ssiQrCodeProps.authenticationRequestOpts.nonce,
      })
      .then((authenticationRequestURI: SIOP.AuthenticationRequestURI) => {
        return authenticationRequestURI.encodedUri
      })
      .catch((reason) => {
        console.log(reason)
        return ''
      })
  }
}
