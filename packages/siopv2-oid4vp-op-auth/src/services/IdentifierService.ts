import { KeyUse } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { _ExtendedIKey } from '@veramo/utils'
import {
  CreateIdentifierArgs,
  DID_PREFIX,
  GetAuthenticationKeyArgs,
  GetIdentifierArgs,
  GetOrCreatePrimaryIdentifierArgs,
  IdentifierAliasEnum,
  IdentifierWithKey,
  KeyManagementSystemEnum,
  SupportedDidMethodEnum,
} from '../types/identifier'
import { IDIDManager, IIdentifier, IKey, IResolver, TAgent } from '@veramo/core'
import { getFirstKeyWithRelation } from '@sphereon/ssi-sdk-ext.did-utils'
import { Siopv2HolderEvent } from '../types'

export const getIdentifierWithKey = async (args: GetIdentifierArgs): Promise<IdentifierWithKey> => {
  const { keyOpts, context } = args

  const identifier =
    keyOpts.identifier ??
    (await getOrCreatePrimaryIdentifier({
      context,
      opts: {
        method: keyOpts.didMethod,
        createOpts: { options: { type: keyOpts.keyType, use: KeyUse.Signature, codecName: keyOpts.codecName } },
      },
    }))
  const key: _ExtendedIKey = await getAuthenticationKey({ identifier, context })
  const kid: string = key.meta.verificationMethod.id

  return { identifier, key, kid }
}

export const getAuthenticationKey = async (args: GetAuthenticationKeyArgs): Promise<_ExtendedIKey> => {
  const { identifier, context } = args
  const agentContext = { ...context, agent: context.agent as TAgent<IResolver & IDIDManager> }

  return (
    (await getFirstKeyWithRelation(identifier, agentContext, 'authentication', false)) ||
    ((await getFirstKeyWithRelation(identifier, agentContext, 'verificationMethod', true)) as _ExtendedIKey)
  )
}

export const getOrCreatePrimaryIdentifier = async (args: GetOrCreatePrimaryIdentifierArgs): Promise<IIdentifier> => {
  const { context, opts } = args

  const identifiers = (await context.agent.didManagerFind(opts?.method ? { provider: `${DID_PREFIX}:${opts?.method}` } : {})).filter(
    (identifier: IIdentifier) =>
      opts?.createOpts?.options?.type === undefined || identifier.keys.some((key: IKey) => key.type === opts?.createOpts?.options?.type),
  )

  if (opts?.method === SupportedDidMethodEnum.DID_KEY) {
    const createOpts = opts?.createOpts ?? {}
    createOpts.options = { codecName: 'EBSI', type: 'Secp256r1', ...createOpts }
    opts.createOpts = createOpts
  }
  const identifier: IIdentifier = !identifiers || identifiers.length == 0 ? await createIdentifier({ context, opts }) : identifiers[0]

  return await context.agent.didManagerGet({ did: identifier.did })
}

export const createIdentifier = async (args: CreateIdentifierArgs): Promise<IIdentifier> => {
  const { context, opts } = args

  const identifier = await context.agent.didManagerCreate({
    kms: opts?.createOpts?.kms ?? KeyManagementSystemEnum.LOCAL,
    ...(opts?.method && { provider: `${DID_PREFIX}:${opts?.method}` }),
    alias: opts?.createOpts?.alias ?? `${IdentifierAliasEnum.PRIMARY}-${opts?.method}-${opts?.createOpts?.options?.type}-${new Date().toUTCString()}`,
    options: opts?.createOpts?.options,
  })

  await context.agent.emit(Siopv2HolderEvent.IDENTIFIER_CREATED, { identifier })

  return identifier
}
