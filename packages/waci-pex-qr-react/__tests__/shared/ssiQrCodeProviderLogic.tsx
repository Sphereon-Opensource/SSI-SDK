import { TAgent } from '@veramo/core'
import { AcceptMode, GoalCode, OobPayload, OobQRProps, QRType, WaciTypes } from '../../src'
import { render, screen } from '@testing-library/react'
// @ts-ignore
import React from 'react'



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
    render(<div data-testid="test-div">{oobQRProps.from}</div>);
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
      await agent.createOobQrCode(oobQRProps).then((ssiQrCode) => {
        expect(ssiQrCode).not.toBeNull()
      })
    })


    it('should create qr code with props', async () => {

      await agent.createOobQrCode(oobQRProps).then(async (ssiQrCode) => {
        render(ssiQrCode);

        // The on generate created a div with test id 'test' and did:key value
        const div = screen.queryByTestId("test-div")
        expect(div!.childNodes[0]!.textContent).toEqual('did:key:zrfdjkgfjgfdjk')

        expect(ssiQrCode.props.value).toEqual(
          'https://example.com/?oob=eyJ0eXBlIjoic2lvcHYyIiwiaWQiOiI1OTlmMzYzOC1iNTYzLTQ5MzctOTQ4Ny1kZmU1NTA5OWQ5MDAiLCJmcm9tIjoiZGlkOmtleTp6cmZkamtnZmpnZmRqayIsImJvZHkiOnsiZ29hbC1jb2RlIjoic3RyZWFtbGluZWQtdnAiLCJhY2NlcHQiOlsic2lvcHYyK29pZGM0dnAiXX19'
        )
        screen.debug()
      })
    })
  })
}
