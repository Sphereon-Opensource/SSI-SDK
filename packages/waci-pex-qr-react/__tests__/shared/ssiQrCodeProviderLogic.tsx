import { TAgent } from '@veramo/core'
import { AcceptMode, GoalCode, OobPayload, OobQRProps, QRType, WaciTypes } from '../../src'
import { shallow } from 'enzyme'

type ConfiguredAgent = TAgent<WaciTypes>

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

    it('should create qr code', async () => {
      agent.createOobQrCode(oobQRProps).then((ssiQrCode) => {
        expect(ssiQrCode).not.toBeNull()
      })
    })

    it('should create qr code with props', async () => {
      agent.createOobQrCode(oobQRProps).then((ssiQrCode) => {
        expect(shallow(ssiQrCode).props().value).toEqual(
          'https://example.com/?oob=eyJ0eXBlIjoic2lvcHYyIiwiaWQiOiI1OTlmMzYzOC1iNTYzLTQ5MzctOTQ4Ny1kZmU1NTA5OWQ5MDAiLCJmcm9tIjoiZGlkOmtleTp6cmZkamtnZmpnZmRqayIsImJvZHkiOnsiZ29hbC1jb2RlIjoic3RyZWFtbGluZWQtdnAiLCJhY2NlcHQiOlsic2lvcHYyK29pZGM0dnAiXX19'
        )
      })
    })
  })
}
