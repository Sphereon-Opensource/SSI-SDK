import {AcceptValue, QRContent, QRMode, SsiQrCodeProps} from '../../src'
import {SIOP} from '@sphereon/did-auth-siop'
import {SiopV2OverOidc4VpQRValue} from "../../src/agent/qr-utils/SiopV2OverOidc4VpQRValue";

export class SsiQrCodePropsDataProvider {
  public static getQRProps(shouldAddCallBack?: boolean): SsiQrCodeProps {
    const authenticationRequestOpts: SIOP.AuthenticationRequestOpts = {
      redirectUri: 'https://example.com/qrCode/callbacks',
          requestBy: {
        type: SIOP.PassBy.VALUE
      },
      signatureType: {
        hexPublicKey: "hexPublicKey2022-01-31 00",
            did: 'did:didMethod2021120900:didId2021120901'
      },
      registration: {
        registrationBy: {
          type: SIOP.PassBy.VALUE
        },
        subjectIdentifiersSupported: SIOP.SubjectIdentifierType.JKT,
            credentialFormatsSupported: SIOP.CredentialFormat.JWT
      },
      state: "State 2022-01-31 00"
    };

    return {
      accept: AcceptValue.OIDC4VP,
      mode: QRMode.DID_AUTH_SIOP_V2,
      authenticationRequestOpts: authenticationRequestOpts,
      strategy: (authenticationRequestOpts: SIOP.AuthenticationRequestOpts) => new SiopV2OverOidc4VpQRValue(authenticationRequestOpts),
      onGenerate: shouldAddCallBack ? SsiQrCodePropsDataProvider.getOnGenerate : () => {},
      bgColor: 'white',
      fgColor: 'black',
      level: 'L',
      size: 128,
      title: 'title2021120903',
    }
  }

  private static getOnGenerate(content: QRContent): void {
    expect(content).not.toBeNull()
  }
}
