import {QrPropValue} from "./QrPropValue";
import {SIOP} from "@sphereon/did-auth-siop/dist/main/types";
import {AcceptValue} from "../../types/ssi-qr-code-provider-types";

export class SiopV2OverOidc4VpQRValue extends QrPropValue {

  constructor(opts: SIOP.AuthenticationRequestOpts) {
    super(opts);
  }

  public validate() {
    return true;
  }

  public acceptValue(): string {
    return AcceptValue.SIOP_OVER_OIDC4VP;
  }
}
