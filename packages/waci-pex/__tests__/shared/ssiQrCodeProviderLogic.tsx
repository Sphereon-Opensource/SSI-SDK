import {TAgent} from '@veramo/core'
import {SsiQrCodeProviderTypes, SsiQrCodeProps} from '../../src'
import {SsiQrCodePropsDataProvider} from "./ssiQrCodePropsDataProvider";
import {shallow} from "enzyme";

type ConfiguredAgent = TAgent<SsiQrCodeProviderTypes>

export default (
    testContext: {
      getAgent: () => ConfiguredAgent;
      setup: () => Promise<boolean>;
      tearDown: () => Promise<boolean>
    }
) => {
  describe('SSI QR Code', () => {
    let ssiQrCodeProvider: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      ssiQrCodeProvider = testContext.getAgent()
    })

    afterAll(async () => {
      await testContext.tearDown()
    })

    it('should create qr code', async () => {
      const ssiQrProps: SsiQrCodeProps = new SsiQrCodePropsDataProvider().getQRProps();
      ssiQrCodeProvider
        .ssiQrCode(ssiQrProps)
        .then(
          ssiQrCode => {
            expect(ssiQrCode).not.toBeNull()
          }
        );
    })

    it('should create qr code with props',async () => {
      const ssiQrProps: SsiQrCodeProps = new SsiQrCodePropsDataProvider().getQRProps();
      ssiQrCodeProvider
      .ssiQrCode(ssiQrProps)
      .then(
          ssiQrCode => {
            expect(shallow(ssiQrCode).props().value).toContain(`"type":"auth","mode":"didauth"`)
          }
      );
    });

    it('should pass back the content to callback',  async () => {
      const ssiQrProps: SsiQrCodeProps = new SsiQrCodePropsDataProvider().getQRProps();
      ssiQrCodeProvider
      .ssiQrCode(ssiQrProps)
      .then(
          ssiQrCode => {
            expect(shallow(ssiQrCode).props().value).toContain(`"type":"auth","mode":"didauth"`)
          }
      );
    });

  });
}
