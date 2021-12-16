import { IAgentPlugin } from '@veramo/core'

import { schema } from '../index'
import { events, IIssueCredentialArgs, IRequiredContext, IVcApiIssuer, IVcApiIssuerArgs } from '../types/IVcApiIssuer'
import { VerifiableCredentialSP } from '@sphereon/ssi-sdk-core'

import { fetch } from 'cross-fetch'

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
    return await fetch(this.issueUrl, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${this.authorizationToken}`,
      },
      body: JSON.stringify({ credential: args.credential }),
    }).then(async (response) => {
      if (response.status >= 400) {
        throw new Error(await response.text())
      } else {
        const verifiableCredential = response.json()
        await context.agent.emit(events.CREDENTIAL_ISSUED, verifiableCredential)
        return verifiableCredential
      }
    })
  }
}
