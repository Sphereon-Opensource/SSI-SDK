import {RP} from "@sphereon/did-auth-siop";
import {SsiQrCodeProps} from "../../types/ssiQrCodeProviderTypes";
import {AuthenticationRequestURI} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";

export class QrPropValue {

  public static qrValue(ssiQrCodeProps: SsiQrCodeProps): Promise<string> {
    let rp = RP.fromRequestOpts(ssiQrCodeProps.authenticationRequestOpts);

    return rp
      .createAuthenticationRequest({
        state: ssiQrCodeProps.authenticationRequestOpts.state,
        nonce: ssiQrCodeProps.authenticationRequestOpts.nonce,
      })
      .then((authenticationRequestURI: AuthenticationRequestURI) => {
        return authenticationRequestURI.encodedUri
      })
      .catch(reason => {
        console.log(reason);
        return '';
      })

  }

}
