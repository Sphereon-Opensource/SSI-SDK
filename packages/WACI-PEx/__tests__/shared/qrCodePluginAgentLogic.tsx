import {TAgent} from '@veramo/core'
import {IQRCodePlugin} from '../../src'
import {QRPropsData} from "./qrCodePropsData";

type ConfiguredAgent = TAgent<IQRCodePlugin>

export default (
    testContext: {
      getAgent: () => ConfiguredAgent;
      setup: () => Promise<boolean>;
      tearDown: () => Promise<boolean>
    }
) => {
  describe('QR-Code creator Agent Plugin', () => {
    let qrCodePlugin: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      qrCodePlugin = testContext.getAgent()
    })

    afterAll(async () => {
      // await new Promise<void>((resolve) => setTimeout(() => resolve(), 30000)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should create qr code', () => {
      let qrCodeResponse = null;
      qrCodePlugin
        .ssiQRCode(QRPropsData.getQRProps())
        .then(
          qrCode => {
            qrCodeResponse = qrCode
            expect(qrCode).not.toBeNull()
          }
        );
      return qrCodeResponse
    })

  })
}
