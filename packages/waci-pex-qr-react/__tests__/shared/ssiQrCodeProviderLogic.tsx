import { TAgent } from '@veramo/core'
import { IQRCodeGenerator } from '../../src'
import { render, screen } from '@testing-library/react'
// @ts-ignore
import React from 'react'
import { oobInvitationCreateElement, oobInvitationCreateValue, siopv2CreateElement, siopv2CreateValue } from './fixtures'

type ConfiguredAgent = TAgent<IQRCodeGenerator>

export default (testContext: { getAgent: () => ConfiguredAgent; setup: () => Promise<boolean>; tearDown: () => Promise<boolean> }) => {
  describe('SSI QR Code', () => {
    let agent: ConfiguredAgent

    beforeAll(async () => {
      await testContext.setup()
      agent = testContext.getAgent()
    })

    afterAll(async () => {
      await testContext.tearDown()
    })

    it('should create DIDComm V2 OOB Invitation qr code value', async () => {
      await agent.didCommOobInvitationValue(oobInvitationCreateValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual(
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19'
        )
      })
    })

    it('should create DIDComm V2 OOB Invitation qr code with renderingProps', async () => {
      await agent.didCommOobInvitationElement(oobInvitationCreateElement).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div')
        expect(div!.childNodes[0]!.textContent).toEqual('did:key:zrfdjkgfjgfdjk')

        expect(ssiQrCode.props.value).toEqual(
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19'
        )
        screen.debug()
      })
    })

    it('should create SIOPv2 qr code value', async () => {
      await agent.siopv2Value(siopv2CreateValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual('openid-vc://?request_uri=https://test.com?id=23')
      })
    })

    it('should create SIOPv2 qr code with renderingProps', async () => {
      await agent.siopv2Element(siopv2CreateElement).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-siopv2')
        expect(div!.childNodes[0]!.textContent).toEqual('https://test.com?id=23')

        expect(ssiQrCode.props.value).toEqual('openid-vc://?request_uri=https://test.com?id=23')
        screen.debug()
      })
    })
  })
}
