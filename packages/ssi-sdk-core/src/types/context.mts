import { IAgentContext, IPluginMethodMap, TAgent } from '@veramo/core'

export function agentContext<TAgentTypes extends IPluginMethodMap>(agent: TAgent<TAgentTypes>): IAgentContext<TAgentTypes> {
  return {
    agent,
  }
}
