import {IAgentPlugin} from '@veramo/core'

import {SsiQrCodeProps} from '../index'
import {events, IRequiredContext, SsiQrCodeProviderTypes} from '../types/ssi-qr-code-provider-types'
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

    let {onGenerate, bgColor, fgColor, level, size, title} = ssiQrCodeProps

    const nonce = shortUUID.generate()
    const state = ssiQrCodeProps.authenticationRequestOpts.state!

    const qrValue = await ssiQrCodeProps.strategy(ssiQrCodeProps.authenticationRequestOpts).qrValue()

    const uri = qrValue.encodedUri;

    if (onGenerate) {
      onGenerate({
        nonce,
        state,
        qrValue: uri,
      })
    }

    await context.agent.emit(events.SSI_QR_CODE_CODE_CREATED, ssiQrCodeProps)
    // console.log("QR code created!")

    return Promise.resolve(<QRCode value={uri} bgColor={bgColor} fgColor={fgColor} level={level} size={size} title={title}/>)
  }
}
