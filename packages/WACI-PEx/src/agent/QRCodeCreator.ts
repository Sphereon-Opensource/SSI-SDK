import {IAgentPlugin} from '@veramo/core'

import {schema} from '../index'
import {events, IQRCodeArgs, IRequiredContext, IQRCodeCreator, IQRCodeCreatorArgs} from '../types/IQRCodeCreator'

const fetch = require('cross-fetch')

/**
 * {@inheritDoc IQRCodeCreator}
 */
export class QRCodeCreator implements IAgentPlugin {
  readonly schema = schema.IQRCodeCreator
  readonly methods: IQRCodeCreator = {
    createQRCode: this.createQRCode.bind(this),
  }
  private readonly qrCodeCreatorData: string
  private readonly authorizationToken: string

  constructor(options: IQRCodeCreatorArgs) {
    this.qrCodeCreatorData = options.qrCodeCreatorData
    this.authorizationToken = options.authorizationToken
  }

  /** {@inheritDoc IQRCodeCreator.createQRCode} */
  private async createQRCode(args: IQRCodeArgs, context: IRequiredContext): Promise<string> {
    return await fetch(this.qrCodeCreatorData, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${this.authorizationToken}`,
      },
      body: JSON.stringify({data: args.data}),
    }).then(async (response: { status: number; text: () => string | PromiseLike<string | undefined> | undefined; json: () => string }) => {
      if (response.status >= 400) {
        throw new Error(await response.text())
      } else {
        const qrCode = response.json()
        await context.agent.emit(events.QR_CODE_CREATED, qrCode)
        return qrCode
      }
    })
  }
}
