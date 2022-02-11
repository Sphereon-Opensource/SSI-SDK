import { AcceptValue, QRContent, QRMode, SsiQrCodeProps } from '../../src'
import { SIOP } from '@sphereon/did-auth-siop'
import { CredentialFormat, SubjectIdentifierType } from '@sphereon/did-auth-siop/dist/main/types/SIOP.types'

export class SsiQrCodePropsDataProvider {
  ssiQrCodeProps: SsiQrCodeProps = {
    accept: AcceptValue.OIDC4VP,
    mode: QRMode.DID_AUTH_SIOP_V2,
    authenticationRequestOpts: {
      redirectUri: 'https://example.com/qrCode/callbacks',
      requestBy: {
        type: SIOP.PassBy.VALUE,
      },
      signatureType: {
        hexPrivateKey: 'e96d4bf41709c1bf9276ed784b39d6f6ae47e7e4091f849e5ab001452340acf7',
        did: 'did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902',
        kid: 'did:ethr:0x93e73FACcc011a8209B35d8c7950670B1a7bd902#controller',
      },
      registration: {
        didMethodsSupported: ['did:ethr:'],
        subjectIdentifiersSupported: SubjectIdentifierType.DID,
        credentialFormatsSupported: [CredentialFormat.JWT],
        registrationBy: {
          type: SIOP.PassBy.VALUE,
        },
      },
      state: 'State 2022-01-31 00',
    },
    onGenerate: (content: QRContent) => {
      console.log('2022021017')
      // Example output of onGenerate:
      // {
      //   "nonce": "gMWABjAANoQ3LfScAF4HPW",
      //   "state": "State 2022-01-31 00",
      //   "qrValue": "openid://?response_type=id_token&scope=openid&client_id=did%3Aethr%3A0x93e73FACcc011a8209B35d8c7950670B1a7bd902&redirect_uri=https%3A%2F%2Fexample.com%2FqrCode%2Fcallbacks&iss=did%3Aethr%3A0x93e73FACcc011a8209B35d8c7950670B1a7bd902&response_mode=post&response_context=rp&nonce=rSwJ_-N_EUO-X7HX3dVAsKe2_jjrxlIMmZakKiTjDdY&state=State%202022-01-31%2000&registration=%7B%22did_methods_supported%22%3A%5B%22did%3Aethr%3A%22%5D%2C%22subject_identifiers_supported%22%3A%22did%22%2C%22credential_formats_supported%22%3A%5B%22jwt%22%5D%7D&request=eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIjY29udHJvbGxlciIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDQ1MDUyODQsImV4cCI6MTY0NDUwNTg4NCwicmVzcG9uc2VfdHlwZSI6ImlkX3Rva2VuIiwic2NvcGUiOiJvcGVuaWQiLCJjbGllbnRfaWQiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL2V4YW1wbGUuY29tL3FyQ29kZS9jYWxsYmFja3MiLCJpc3MiOiJkaWQ6ZXRocjoweDkzZTczRkFDY2MwMTFhODIwOUIzNWQ4Yzc5NTA2NzBCMWE3YmQ5MDIiLCJyZXNwb25zZV9tb2RlIjoicG9zdCIsInJlc3BvbnNlX2NvbnRleHQiOiJycCIsIm5vbmNlIjoiclN3Sl8tTl9FVU8tWDdIWDNkVkFzS2UyX2pqcnhsSU1tWmFrS2lUakRkWSIsInN0YXRlIjoiU3RhdGUgMjAyMi0wMS0zMSAwMCIsInJlZ2lzdHJhdGlvbiI6eyJkaWRfbWV0aG9kc19zdXBwb3J0ZWQiOlsiZGlkOmV0aHI6Il0sInN1YmplY3RfaWRlbnRpZmllcnNfc3VwcG9ydGVkIjoiZGlkIiwiY3JlZGVudGlhbF9mb3JtYXRzX3N1cHBvcnRlZCI6WyJqd3QiXX19.Sld1kZvV5NNL592MT16ssVVmNif4MhkxUtsRZcHxxUXWXgae4ilbgK1O_pY1ISi-dtQXES0Lp8pzkVj2w47sPA"
      // }
      expect(content).not.toBeNull()
    },
    bgColor: 'white',
    fgColor: 'black',
    level: 'L',
    size: 128,
    title: 'title2021120903',
  }

  public getQRProps(): SsiQrCodeProps {
    return this.ssiQrCodeProps
  }
}
