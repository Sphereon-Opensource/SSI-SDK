import { TAgent } from '@veramo/core'
import { IQRCodeGenerator } from '../../src'
import { render, screen } from '@testing-library/react'
// @ts-ignore
import React from 'react'
import {
  credentialOffer,
  oobInvitationCreateElement,
  oobInvitationCreateValue,
  openid4vciCreateElementByReference,
  openid4vciCreateElementByValue,
  openid4vciCreateElementValid,
  openid4vciCreateValueByReference,
  openid4vciCreateValueByValue,
  openid4vciCreateValueValid,
  openid4vciCreateValueWrong,
  siopv2CreateElement,
  siopv2CreateValue,
} from './fixtures'

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
      await agent.qrDIDCommOobInvitationValue(oobInvitationCreateValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual(
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19',
        )
      })
    })

    it('should create DIDComm V2 OOB Invitation qr code with renderingProps', async () => {
      await agent.qrDIDCommOobInvitationElement(oobInvitationCreateElement).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div')
        expect(div!.childNodes[0]!.textContent).toEqual('did:key:zrfdjkgfjgfdjk')

        expect(ssiQrCode.props.value).toEqual(
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19',
        )
        screen.debug()
      })
    })

    it('should create SIOPv2 qr code value', async () => {
      await agent.qrSIOPv2Value(siopv2CreateValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual('openid-vc://?request_uri=https://test.com?id=23')
      })
    })

    it('should create SIOPv2 qr code with renderingProps', async () => {
      await agent.qrSIOPv2Element(siopv2CreateElement).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-siopv2')
        expect(div!.childNodes[0]!.textContent).toEqual('https://test.com?id=23')

        expect(ssiQrCode.props.value).toEqual('openid-vc://?request_uri=https://test.com?id=23')
        screen.debug()
      })
    })

    it('should create OpenID4VCI qr code value - by reference, has scheme in baseUri and no scheme', async () => {
      await agent.qrOpenID4VCIValue(openid4vciCreateValueByReference).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual('openid-credential-offer://test.com/resources?credential_offer_uri=https://test.com?id=234')
      })
    })

    it('should create OpenID4VCI qr code with renderingProps - by reference, has scheme in baseUri and no scheme', async () => {
      await agent.qrOpenID4VCIElement(openid4vciCreateElementByReference).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-openid4vci')
        expect(div!.childNodes[0]!.textContent).toEqual('https://test.com?id=234')

        expect(ssiQrCode.props.value).toEqual('openid-credential-offer://test.com/resources?credential_offer_uri=https://test.com?id=234')
        screen.debug()
      })
    })

    it('should create OpenID4VCI qr code value - by value, scheme not in baseUri and scheme ', async () => {
      await agent.qrOpenID4VCIValue(openid4vciCreateValueByValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual(`https://test.com/credential-offer?credential_offer=${credentialOffer}`)
      })
    })

    it('should fail to create OpenID4VCI qr code value - by value, scheme in baseUri and different scheme', async () => {
      await expect(() => agent.qrOpenID4VCIValue(openid4vciCreateValueWrong)).rejects.toThrow(
        Error('The uri must contain the same scheme or omit it'),
      )
    })

    it('should create OpenID4VCI qr code with renderingProps - by value, scheme not in baseUri and scheme', async () => {
      await agent.qrOpenID4VCIElement(openid4vciCreateElementByValue).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-openid4vci')
        expect(div!.childNodes[0]!.textContent).toEqual(credentialOffer)

        expect(ssiQrCode.props.value).toEqual(`https://test.com/credential-offer?credential_offer=${credentialOffer}`)
        screen.debug()
      })
    })

    it('should create OpenID4VCI qr code value - by reference, scheme in uri and same scheme', async () => {
      await agent.qrOpenID4VCIValue(openid4vciCreateValueValid).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual(`https://test.com/credential-offer?credential_offer_uri=https://test.com?id=234`)
      })
    })

    it('should create OpenID4VCI qr code with renderingProps - by reference, scheme in uri and same scheme', async () => {
      await agent.qrOpenID4VCIElement(openid4vciCreateElementValid).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-openid4vci')
        expect(div!.childNodes[0]!.textContent).toEqual('https://test.com?id=234')

        expect(ssiQrCode.props.value).toEqual(`https://test.com/credential-offer?credential_offer_uri=https://test.com?id=234`)
        screen.debug()
      })
    })
  })
}
