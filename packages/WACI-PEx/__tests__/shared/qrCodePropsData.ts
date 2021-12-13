import {QRContent, QRMode, QRProps, QRType} from "../../src";

export class QRPropsData {
  public static getQRProps() {
    const qrProps: QRProps = {
      type: QRType.AUTHENTICATION,
      did: "did:didMehtod2021120900:didId2021120901",
      mode: QRMode.DID_AUTH_SIOP_V2,
      redirectUrl: "https://example.com/qrCode/callbacks",
      onGenerate: (content: QRContent) => {
        expect(content).not.toBeNull()
      },
      bgColor: "white",
      fgColor: "black",
      level: 'L',
      size: 128,
      title: "title2021120903"
    }
    return qrProps;
  }
}
