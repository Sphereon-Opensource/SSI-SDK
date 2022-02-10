import {AuthenticationRequestURI} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";
import {SIOP, RP} from "@sphereon/did-auth-siop";
import {SsiQrCodeProps} from "../../types/ssiQrCodeProviderTypes";

export class QrPropValue {

  private qrValueStr: string = '';

  public qrValue(ssiQrCodeProps: SsiQrCodeProps): string {

    QrPropValue
      .url(ssiQrCodeProps.authenticationRequestOpts)
      .then(value => this.qrValueStr = value.encodedUri);

    return this.qrValueStr;
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
