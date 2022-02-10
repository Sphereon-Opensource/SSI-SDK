import {AuthenticationRequestURI} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";
import {SIOP, RP} from "@sphereon/did-auth-siop";
import {SsiQrCodeProps} from "../../types/ssiQrCodeProviderTypes";

export abstract class QrPropValue {

  public static qrValue(ssiQrCodeProps: SsiQrCodeProps): string {
    let qrValue: string = '';

    QrPropValue
      .url(ssiQrCodeProps.authenticationRequestOpts)
      .then(value => qrValue = value.encodedUri);

    return qrValue;
  }

  private static async url(authenticationRequestOpts: SIOP.AuthenticationRequestOpts): Promise<AuthenticationRequestURI> {
    return await RP
    .fromRequestOpts(authenticationRequestOpts)
    .createAuthenticationRequest({
      state: authenticationRequestOpts.state,
      nonce: authenticationRequestOpts.nonce,
    });
  }


}
