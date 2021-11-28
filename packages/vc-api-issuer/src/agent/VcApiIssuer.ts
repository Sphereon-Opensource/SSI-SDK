import { IAgentPlugin } from '@veramo/core'

import { schema } from '../index'
import { events, IIssueCredentialArgs, IRequiredContext, IVcApiIssuer, IVcApiIssuerArgs } from '../types/IVcApiIssuer'
import { VerifiableCredentialSP } from '@sphereon/ssi-sdk-core'

const fetch = require('cross-fetch')

/**
 * {@inheritDoc IVcApiIssuer}
 */
export class VcApiIssuer implements IAgentPlugin {
  readonly schema = schema.IVcApiIssuer
  readonly methods: IVcApiIssuer = {
    issueCredentialUsingVcApi: this.issueCredentialUsingVcApi.bind(this),
  }
  private readonly issueUrl: string
  private readonly authorizationToken: string

  constructor(options: IVcApiIssuerArgs) {
    this.issueUrl = options.issueUrl
    this.authorizationToken = options.authorizationToken
  }

  /** {@inheritDoc IVcApiIssuer.issueCredentialUsingVcApi} */
  private async issueCredentialUsingVcApi(args: IIssueCredentialArgs, context: IRequiredContext): Promise<VerifiableCredentialSP> {
    const verifiableCredential = await fetch(this.issueUrl, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${this.authorizationToken}`,
      },
      body: JSON.stringify({ credential: args.credential }),
    }).then(async (response: { status: number; text: () => string | PromiseLike<string | undefined> | undefined; json: () => string }) => {
      if (response.status >= 400) {
        throw new Error(await response.text())
      } else {
        const verifiableCredential = response.json()
        await context.agent.emit(events.CREDENTIAL_ISSUED, verifiableCredential)
        return verifiableCredential
      }
    })

    return verifiableCredential
  }
}
