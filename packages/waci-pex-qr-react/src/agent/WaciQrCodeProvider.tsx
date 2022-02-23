import { IAgentPlugin } from '@veramo/core'

import { events, IRequiredContext, OobQRProps, WaciTypes } from '../types/WaciTypes'
import React from 'react'
import QRCode from 'react-qr-code'
import { OutOfBandMessage } from './qr-utils/outOfBandMessage'

/**
 * {@inheritDoc WaciTypes}
 */
export class WaciQrCodeProvider implements IAgentPlugin {
  readonly methods: WaciTypes = {
    createOobQrCode: WaciQrCodeProvider.createOobQrCode.bind(this),
  }

  /** {@inheritDoc WaciTypes.createOobQrCode} */
  private static async createOobQrCode(oobQRProps: OobQRProps, context: IRequiredContext): Promise<JSX.Element> {
    const { onGenerate, bgColor, fgColor, level, size, title } = oobQRProps

    const payload = OutOfBandMessage.createPayload(oobQRProps)
    const encoded = OutOfBandMessage.urlEncode(payload)
    const url = oobQRProps.oobBaseUrl + encoded

    if (onGenerate) {
      onGenerate(oobQRProps, payload)
    }
    await context.agent.emit(events.WACI_OOB_QR_CODE_CODE_CREATED, { props: oobQRProps, payload })

    return <QRCode value={url} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title} />
  }
}
