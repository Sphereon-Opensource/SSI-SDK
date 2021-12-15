import {IAgentPlugin} from '@veramo/core'

import {SsiQrCodeProps} from '../index'
import {events, SsiQrCodeProviderTypes, IRequiredContext} from '../types/ssi-qr-code-provider-types'
import React from 'react'
import QRCode from 'react-qr-code'
import shortUUID from 'short-uuid'

/**
 * {@inheritDoc SsiQrCodeProviderTypes}
 */
export class SsiQrCodeProvider implements IAgentPlugin {
  readonly methods: SsiQrCodeProviderTypes = {
    ssiQrCode: SsiQrCodeProvider.createSsiQrCode.bind(this),
  }

  /** {@inheritDoc SsiQrCodeProviderTypes.createSsiQrCode} */
  private static async createSsiQrCode(ssiQrCodeProps: SsiQrCodeProps, context: IRequiredContext): Promise<JSX.Element> {
    let {type, did, mode, redirectUrl, onGenerate, bgColor, fgColor, level, size, title} = ssiQrCodeProps
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

    let qrCode = <QRCode value={value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title}/>;
    context.agent.emit(events.SSI_QR_CODE_CODE_CREATED, qrCode)
    // console.log("QR code created!")

    return Promise.resolve(qrCode)
  }
}
