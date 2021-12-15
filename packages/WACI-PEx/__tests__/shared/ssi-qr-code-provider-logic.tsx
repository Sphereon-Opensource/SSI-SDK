import {TAgent} from '@veramo/core'
import {SsiQrCodeProviderTypes, SsiQrCodeProps} from '../../src'
import {SsiQrCodePropsDataProvider} from "./ssi-qr-code-props-data-provider";
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

    it('should create qr code',  () => {
      const ssiQrProps: SsiQrCodeProps = SsiQrCodePropsDataProvider.getQRProps();
      ssiQrCodeProvider
        .ssiQrCode(ssiQrProps)
        .then(
          ssiQrCode => {
            expect(ssiQrCode).not.toBeNull()
          }
        );
    })

    it('should create qr code with props',  () => {
      const ssiQrProps: SsiQrCodeProps = SsiQrCodePropsDataProvider.getQRProps();
      ssiQrCodeProvider
      .ssiQrCode(ssiQrProps)
      .then(
          ssiQrCode => {
            expect(shallow(ssiQrCode).props().value).toContain(`"type":"auth","did":"${ssiQrProps.did}","mode":"didauth"`)
          }
      );
    })

    it('should pass back the content to callback',  () => {
      const ssiQrProps: SsiQrCodeProps = SsiQrCodePropsDataProvider.getQRProps(true);
      ssiQrCodeProvider
      .ssiQrCode(ssiQrProps)
      .then(
          ssiQrCode => {
            expect(shallow(ssiQrCode).props().value).toContain(`"type":"auth","did":"${ssiQrProps.did}","mode":"didauth"`)
          }
      );
    })

  })
}
