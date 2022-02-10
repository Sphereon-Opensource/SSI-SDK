import {IAgentPlugin} from '@veramo/core'

import {events, IRequiredContext, SsiQrCodeProps, SsiQrCodeProviderTypes} from '../types/ssiQrCodeProviderTypes'
import React from 'react'
import QRCode from 'react-qr-code'
import shortUUID from 'short-uuid'
import {QrPropValue} from './qr-utils/qrPropValue';

/**
 * {@inheritDoc SsiQrCodeProviderTypes}
 */
export class SsiQrCodeProvider implements IAgentPlugin {
  readonly methods: SsiQrCodeProviderTypes = {
    ssiQrCode: SsiQrCodeProvider.createSsiQrCode.bind(this),
  }

  /** {@inheritDoc SsiQrCodeProviderTypes.createSsiQrCode} */
  private static async createSsiQrCode(ssiQrCodeProps: SsiQrCodeProps, context: IRequiredContext): Promise<JSX.Element> {
    const {onGenerate, bgColor, fgColor, level, size, title} = ssiQrCodeProps

    const nonce = shortUUID.generate()

    const value = await QrPropValue.qrValue(ssiQrCodeProps)

    if (onGenerate) {
      const state = ssiQrCodeProps?.authenticationRequestOpts?.state
      onGenerate({
        nonce,
        state,
        qrValue: value,
      })
    }
    await context.agent.emit(events.SSI_QR_CODE_CODE_CREATED, ssiQrCodeProps)

    return <QRCode value={value} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title}/>
  }

}
