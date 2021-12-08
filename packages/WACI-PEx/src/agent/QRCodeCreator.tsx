import { IAgentPlugin } from '@veramo/core'

import { QRProps, schema } from '../index'
import { events, IRequiredContext, IQRCodeCreator } from '../types/IQRCodeCreator'
import QRCode from 'react-qr-code'
import shortUUID from 'short-uuid'
import { FC } from 'react'
/**
 * {@inheritDoc IQRCodeCreator}
 */
export class QRCodeCreator implements IAgentPlugin {
  readonly schema = schema.IQRCodeCreator
  readonly methods: IQRCodeCreator = {
    createQRCode: QRCodeCreator.createQRCode.bind(this),
  }

  /** {@inheritDoc IQRCodeCreator.createQRCode} */
  private static createQRCode(qrProps: QRProps, context: IRequiredContext): Promise<FC<QRProps>> {
    let { type, did, mode, redirectUrl, onGenerate, bgColor, fgColor, level, size, title } = qrProps
    const state = shortUUID.generate()
    const value = `{"state":"${state}","type":"${type}","did":"${did}","mode":"${mode}","redirectUrl":"${redirectUrl}"}`

    if (onGenerate) {
      onGenerate({
        state,
        type,
        did,
        mode,
        redirectUrl,
        qrValue: value,
      })
    }

    context.agent.emit(events.QR_CODE_CREATED, qrProps)

    return <QRCode value={value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title} />
  }
}
