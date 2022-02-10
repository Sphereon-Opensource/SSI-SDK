import {AcceptValue, QRContent, QRMode, SsiQrCodeProps} from '../../src'
import {SIOP} from '@sphereon/did-auth-siop'
import {CredentialFormat, SubjectIdentifierType} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";


export class SsiQrCodePropsDataProvider {

  authenticationRequestOpts: SIOP.AuthenticationRequestOpts = {
    redirectUri: 'https://example.com/qrCode/callbacks',
    requestBy: {
      type: SIOP.PassBy.VALUE
    },
    signatureType: {
      hexPrivateKey: "e96d4bf41709c1bf9276ed784b39d6f6ae47e7e4091f849e5ab001452340acf7",
      did: "did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902",
      kid: "did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902#controller",
    },
    registration: {
      didMethodsSupported: ['did:ethr:'],
      subjectIdentifiersSupported: SubjectIdentifierType.DID,
      credentialFormatsSupported: [CredentialFormat.JWT],
      registrationBy: {
        type: SIOP.PassBy.VALUE,
      },
    },
    state: "State 2022-01-31 00"
  };

  public getQRProps(shouldAddCallBack?: boolean): SsiQrCodeProps {

    return {
      accept: AcceptValue.OIDC4VP,
      mode: QRMode.DID_AUTH_SIOP_V2,
      authenticationRequestOpts: this.authenticationRequestOpts,
      onGenerate: shouldAddCallBack ? this.getOnGenerate : () => {},
      bgColor: 'white',
      fgColor: 'black',
      level: 'L',
      size: 128,
      title: 'title2021120903',
    };
  }

  private getOnGenerate(content: QRContent): void {
    expect(content).not.toBeNull()
  }
}
