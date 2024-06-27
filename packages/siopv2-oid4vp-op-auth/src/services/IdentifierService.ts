import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { _ExtendedIKey } from '@veramo/utils'
import { DidAgents, GetIdentifierArgs, IdentifierWithKey } from '../types/identifier'
import { getAuthenticationKey, getOrCreatePrimaryIdentifier } from '@sphereon/ssi-sdk-ext.did-utils'
import { IIdentifier } from '@veramo/core'
import { Siopv2HolderEvent } from '../types'

export const getIdentifierWithKey = async (args: GetIdentifierArgs): Promise<IdentifierWithKey> => {
  const { keyOpts, context } = args
  const agentContext = { ...context, agent: context.agent as DidAgents }

  let identifier: IIdentifier
  if (keyOpts.identifier) {
    identifier = keyOpts.identifier
  } else {
    const { result, created } = await getOrCreatePrimaryIdentifier(agentContext, {
      method: keyOpts.didMethod,
      createOpts: {
        options: {
          type: keyOpts.keyType,
          use: KeyUse.Signature,
          codecName: keyOpts.codecName,
        },
      },
    })

    identifier = result
    if (created) {
      await agentContext.agent.emit(Siopv2HolderEvent.IDENTIFIER_CREATED, { identifier })
    }
  }
  const key: _ExtendedIKey = await getAuthenticationKey(identifier, agentContext)
  const kid: string = key.meta.verificationMethod.id

  return { identifier, key, kid }
}
