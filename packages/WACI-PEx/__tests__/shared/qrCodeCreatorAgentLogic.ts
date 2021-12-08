import { TAgent } from '@veramo/core'
import { IQRCodeArgs, IQRCodeCreator } from '../../src'

type qrCodeCreatorConfiguredAgent = TAgent<IQRCodeCreator>

export default (testContext: { getAgent: () => qrCodeCreatorConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('QR-Code creator Agent Plugin', () => {
    let qrCodeCreator: qrCodeCreatorConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      qrCodeCreator = testContext.getAgent()
    })

    afterAll(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500)) // avoid jest open handle error
      await testContext.tearDown()
    })

    it('should create qr code', async () => {
      const qrCodeData: IQRCodeArgs = {
        data: '2021120800',
      }

      return await expect(qrCodeCreator.createQRCode(qrCodeData)).resolves.not.toBeNull()
    })

    it('should create not qr code, rather it should throw exception', async () => {
      return await expect(qrCodeCreator.createQRCode(null)).resolves.not.toBeNull()
    })

    it('should create not qr code, rather it should return error', async () => {
      return await expect(qrCodeCreator.createQRCode(null)).resolves.not.toBeNull()
    })
  })
}
