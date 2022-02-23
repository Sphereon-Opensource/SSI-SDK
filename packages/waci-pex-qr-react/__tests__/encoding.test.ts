import { AcceptMode, GoalCode, OobPayload, OobQRProps, QRType } from '../src'
import { OutOfBandMessage } from '../src/agent/qr-utils/outOfBandMessage'
import base64url from 'base64url'

const oobQRProps: OobQRProps = {
  oobBaseUrl: 'https://example.com/?oob=',
  type: QRType.DID_AUTH_SIOP_V2,
  id: '599f3638-b563-4937-9487-dfe55099d900',
  from: 'did:key:zrfdjkgfjgfdjk',
  body: {
    goalCode: GoalCode.STREAMLINED_VP,
    accept: [AcceptMode.SIOPV2_WITH_OIDC4VP],
  },
  onGenerate: (oobQRProps: OobQRProps, payload: OobPayload) => {
    console.log(payload)
  },
  bgColor: 'white',
  fgColor: 'black',
  level: 'L',
  size: 128,
  title: 'title2021120903',
}

describe('SSI QR Code', () => {
  it('should create payload object', async () => {
    const payload = OutOfBandMessage.createPayload(oobQRProps)
    // const encoded = OutOfBandMessage.encode(payload)
    // const url = oobQRProps.oobBaseUrl + encoded

    expect(payload).toMatchObject({
      body: { accept: ['siopv2+oidc4vp'], goalCode: 'streamlined-vp' },
      from: 'did:key:zrfdjkgfjgfdjk',
      id: '599f3638-b563-4937-9487-dfe55099d900',
      type: 'siopv2',
    })
  })

  it('should create json value', async () => {
    const payload = OutOfBandMessage.createPayload(oobQRProps)
    const json = OutOfBandMessage.toJson(payload)
    expect(json).toMatch(
      '{"type":"siopv2","id":"599f3638-b563-4937-9487-dfe55099d900","from":"did:key:zrfdjkgfjgfdjk","body":{"goal-code":"streamlined-vp","accept":["siopv2+oidc4vp"]}}'
    )
  })

  it('should url encode and decode', async () => {
    const payload = OutOfBandMessage.createPayload(oobQRProps)
    const urlEncoded = OutOfBandMessage.urlEncode(payload)
    expect(urlEncoded).toMatch(
      'eyJ0eXBlIjoic2lvcHYyIiwiaWQiOiI1OTlmMzYzOC1iNTYzLTQ5MzctOTQ4Ny1kZmU1NTA5OWQ5MDAiLCJmcm9tIjoiZGlkOmtleTp6cmZkamtnZmpnZmRqayIsImJvZHkiOnsiZ29hbC1jb2RlIjoic3RyZWFtbGluZWQtdnAiLCJhY2NlcHQiOlsic2lvcHYyK29pZGM0dnAiXX19'
    )
    expect(base64url.decode(urlEncoded)).toMatch(
      '{"type":"siopv2","id":"599f3638-b563-4937-9487-dfe55099d900","from":"did:key:zrfdjkgfjgfdjk","body":{"goal-code":"streamlined-vp","accept":["siopv2+oidc4vp"]}}'
    )
  })
})
