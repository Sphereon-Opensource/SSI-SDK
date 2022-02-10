import {RP, SIOP} from "@sphereon/did-auth-siop";
import {SsiQrCodeProps} from "../../types/ssiQrCodeProviderTypes";
import {AuthenticationRequestURI} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";

export class QrPropValue {

  public static async qrValue(ssiQrCodeProps: SsiQrCodeProps): Promise<string> {
    const authenticationRequestOpts: SIOP.AuthenticationRequestOpts = ssiQrCodeProps.authenticationRequestOpts;

    const authenticationRequestURI: AuthenticationRequestURI = await RP
      .fromRequestOpts(authenticationRequestOpts)
      .createAuthenticationRequest({
        state: authenticationRequestOpts.state,
        nonce: authenticationRequestOpts.nonce,
      });

   return authenticationRequestURI.encodedUri;
  }

}
