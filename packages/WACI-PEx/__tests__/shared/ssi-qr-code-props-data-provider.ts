import { QRContent, QRMode, QRType, SsiQrCodeProps } from '../../src'

export class SsiQrCodePropsDataProvider {
  public static getQRProps(shouldAddCallBack?: boolean): SsiQrCodeProps {
    return {
      type: QRType.AUTHENTICATION,
      did: 'did:didMethod2021120900:didId2021120901',
      mode: QRMode.DID_AUTH_SIOP_V2,
      redirectUrl: 'https://example.com/qrCode/callbacks',
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
