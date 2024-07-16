import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { _ExtendedIKey } from '@veramo/utils'
import { DidAgents, GetIdentifierArgs, IdentifierWithKey } from '../types'
import { getAuthenticationKey, getOrCreatePrimaryIdentifier } from '@sphereon/ssi-sdk-ext.did-utils'

export const getIdentifierWithKey = async (args: GetIdentifierArgs): Promise<IdentifierWithKey> => {
  const { keyOpts, context } = args
  const agentContext = { ...context, agent: context.agent as DidAgents }

  const identifier =
    keyOpts.identifier ??
    (await getOrCreatePrimaryIdentifier(agentContext, {
      method: keyOpts.didMethod,
      createOpts: { options: { type: keyOpts.keyType, use: KeyUse.Signature, codecName: keyOpts.codecName } },
    }))
  const key: _ExtendedIKey = await getAuthenticationKey({ identifier, keyType: keyOpts.keyType }, agentContext)
  const kid: string = key.meta.verificationMethod.id

  return { identifier, key, kid }
}
