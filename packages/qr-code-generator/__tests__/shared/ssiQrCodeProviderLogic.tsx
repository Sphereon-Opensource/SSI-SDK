import { TAgent } from '@veramo/core'
import { IQRCodeGenerator } from '../../src'
import { render, screen } from '@testing-library/react'
// @ts-ignore
import React from 'react'
import {
  oobInvitationCreateElement,
  oobInvitationCreateValue,
  openid4vciCreateElementByReference,
  openid4vciCreateElementByValue,
  openid4vciCreateValueByReference,
  openid4vciCreateValueByValue,
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
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19'
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
          'https://example.com/?_oob=eyJ0eXBlIjoiaHR0cHM6Ly9kaWRjb21tLm9yZy9vdXQtb2YtYmFuZC8yLjAvaW52aXRhdGlvbiIsImlkIjoiNTk5ZjM2MzgtYjU2My00OTM3LTk0ODctZGZlNTUwOTlkOTAwIiwiZnJvbSI6ImRpZDprZXk6enJmZGprZ2ZqZ2ZkamsiLCJib2R5Ijp7ImdvYWxfY29kZSI6InN0cmVhbWxpbmVkLXZwIiwiYWNjZXB0IjpbImRpZGNvbW0vdjIiXX19'
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

    it('should create OpenID4VCI qr code value - by reference', async () => {
      await agent.qrOpenID4VCIValue(openid4vciCreateValueByReference).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual('openid-credential-offer://?credential_offer_uri=https://test.com?id=234')
      })
    })

    it('should create OpenID4VCI qr code with renderingProps - by reference', async () => {
      await agent.qrOpenID4VCIElement(openid4vciCreateElementByReference).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-openid4vci')
        expect(div!.childNodes[0]!.textContent).toEqual('https://test.com?id=234')

        expect(ssiQrCode.props.value).toEqual('openid-credential-offer://?credential_offer_uri=https://test.com?id=234')
        screen.debug()
      })
    })

    const expected =
      'https://test.com/credential-offer?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fcredential-issuer.example.com' +
      '%22%2C%22credentials%22%3A%5B%22UniversityDegree_JWT%22%2C%7B%22format%22%3A%22mso_mdoc%22%2C%22doctype%22%3A%22org.iso.18013.5.1.mDL%22%7D' +
      '%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%22issuer_state%22%3A%22eyJhbGciOiJSU0Et...FYUaBy%22%7D%2C%22urn%3Aietf%3Aparams%3Aoa' +
      'uth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22pre-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D'
    it('should create OpenID4VCI qr code value - by value', async () => {
      await agent.qrOpenID4VCIValue(openid4vciCreateValueByValue).then((ssiQrCode) => {
        expect(ssiQrCode).toEqual(expected)
      })
    })

    it('should create OpenID4VCI qr code with renderingProps - by value', async () => {
      const expectedLocal =
        '"%7B%22credential_issuer%22%3A%22https%3A%2F%2Fcredential-issuer.example.com%22%2C%22credentials%22%3A%5B%22UniversityDegree_JW' +
        'T%22%2C%7B%22format%22%3A%22mso_mdoc%22%2C%22doctype%22%3A%22org.iso.18013.5.1.mDL%22%7D%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A' +
        '%7B%22issuer_state%22%3A%22eyJhbGciOiJSU0Et...FYUaBy%22%7D%2C%22urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Apre-authorized_code%22%3A%7B%22p' +
        're-authorized_code%22%3A%22adhjhdjajkdkhjhdj%22%2C%22user_pin_required%22%3Atrue%7D%7D%7D"'
      await agent.qrOpenID4VCIElement(openid4vciCreateElementByValue).then(async (ssiQrCode) => {
        render(ssiQrCode)

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId('test-div-openid4vci')
        expect(div!.childNodes[0]!.textContent).toEqual(expectedLocal)

        expect(ssiQrCode.props.value).toEqual(expected)
        screen.debug()
      })
    })
  })
}
