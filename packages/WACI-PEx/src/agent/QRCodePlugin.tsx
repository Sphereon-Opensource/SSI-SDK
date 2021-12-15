import {IAgentPlugin} from '@veramo/core'

import {QRProps} from '../index'
import {events, IQRCodePlugin, IRequiredContext} from '../types/IQRCodePlugin'
import React from 'react'
import QRCode from 'react-qr-code'
import shortUUID from 'short-uuid'

/**
 * {@inheritDoc IQRCodePlugin}
 */
export class QRCodePlugin implements IAgentPlugin {
  readonly methods: IQRCodePlugin = {
    ssiQRCode: this.ssiQRCode.bind(this),
  }

  /** {@inheritDoc IQRCodePlugin.ssiQRCode} */
  private async ssiQRCode(qrProps: QRProps, context: IRequiredContext): Promise<JSX.Element> {

    console.log("agent entered")

    let {type, did, mode, redirectUrl, onGenerate, bgColor, fgColor, level, size, title} = qrProps
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

    return Promise.resolve(<QRCode value={value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title}/>)
  }
}
