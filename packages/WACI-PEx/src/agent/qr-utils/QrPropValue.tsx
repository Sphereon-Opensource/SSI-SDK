import {AuthenticationRequestURI} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";
import {RP, SIOP} from "@sphereon/did-auth-siop";

export abstract class QrPropValue {

  private readonly _authRequestOpts: SIOP.AuthenticationRequestOpts

  protected constructor(authRequestOpts: SIOP.AuthenticationRequestOpts) {
    this._authRequestOpts = authRequestOpts
  }

  public abstract validate(): boolean

  public abstract acceptValue(): string

  public async qrValue(): Promise<AuthenticationRequestURI> {
    if (this.validate()) {
      return await RP.fromRequestOpts(this._authRequestOpts).createAuthenticationRequest({
        state: this._authRequestOpts.state,
        nonce: this._authRequestOpts.nonce,
      });
    } else {
      throw new Error('The object does not conform to object type mentioned by the accept value: ' + this.acceptValue())
    }
  }
}




