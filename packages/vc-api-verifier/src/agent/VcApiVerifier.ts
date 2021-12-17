import { IAgentPlugin } from '@veramo/core'

import { schema } from '../index'
import { events, IRequiredContext, IVcApiVerifier, IVcApiVerifierArgs, IVerifyCredentialArgs, IVerifyCredentialResult } from '../types/IVcApiVerifier'

import { fetch } from 'cross-fetch'

/**
 * {@inheritDoc IVcApiVerifier}
 */
export class VcApiVerifier implements IAgentPlugin {
  readonly schema = schema.IVcApiVerfierAgentPlugin
  readonly methods: IVcApiVerifier = {
    verifyCredentialUsingVcApi: this.verifyCredentialUsingVcApi.bind(this),
  }
  private readonly verifyUrl: string

  constructor(options: IVcApiVerifierArgs) {
    this.verifyUrl = options.verifyUrl
  }

  /** {@inheritDoc IVcApiVerifier.verifyCredentialUsingVcApi} */
  private async verifyCredentialUsingVcApi(args: IVerifyCredentialArgs, context: IRequiredContext): Promise<IVerifyCredentialResult> {
    return await fetch(this.verifyUrl, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verifiableCredential: args.credential }),
    })
      .then(async (response) => {
        if (response.status >= 400) {
          throw new Error(await response.text())
        } else {
          return response.json()
        }
      })
      .then(async (verificationResult) => {
        await context.agent.emit(events.CREDENTIAL_VERIFIED, verificationResult)
        return verificationResult
      })
  }
}
