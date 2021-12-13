import {IAgentPlugin} from '@veramo/core'

import {QRProps, schema} from '../index'
import {events, IQRCodePlugin, IRequiredContext} from '../types/IQRCodePlugin'
import {FC} from 'react'
import {SSIQRCode} from "./SSIQRCode";

/**
 * {@inheritDoc IQRCodePlugin}
 */
export class QRCodePlugin implements IAgentPlugin {
  readonly schema = schema.IQRCodePlugin
  readonly methods: IQRCodePlugin = {
    ssiQRCode: this.ssiQRCode.bind(this),
  }

  /** {@inheritDoc IQRCodePlugin.ssiQRCode} */
  private ssiQRCode(qrProps: QRProps, context: IRequiredContext): Promise<FC<QRProps>> {
    context.agent.emit(events.QR_CODE_CREATED, qrProps)
    return new Promise(() => {
      return SSIQRCode(qrProps)
    });
  }
}
