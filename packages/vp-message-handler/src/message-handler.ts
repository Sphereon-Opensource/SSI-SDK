import { IAgentContext, IResolver } from '@veramo/core'
import { AbstractMessageHandler, Message } from '@veramo/message-handler'
import Debug from 'debug'
import { CredentialMapper, OriginalVerifiablePresentation } from '@sphereon/ssi-types'

const debug = Debug('sphereon:vp-message-handler:message-handler')

export type IContext = IAgentContext<IResolver>

/**
 * A plugin for {@link @sphereon/ssi-sdk-vp-message-handler#VpMessageHandler} that unpacks & uniforms a VC/VP
 * @public
 */
export class VpMessageHandler extends AbstractMessageHandler {
  async handle(message: Message, context: IContext): Promise<Message> {
    if (message.raw) {
      try {
        const parsed = JSON.parse(message.raw)
        if (parsed && parsed['jwt_vp']) {
          message.raw = parsed['jwt_vp']
          const jwtDecodedVp = CredentialMapper.toWrappedVerifiablePresentation(message.raw as OriginalVerifiablePresentation).decoded
          if (jwtDecodedVp.aud) {
            message.addMetaData({ type: 'JWT' })
            message.data = jwtDecodedVp // Only load data if we are going to return the message, we don't want Velocity VP's to crash in Veramo handlers due to the missing @context section
            return message
          }
        }
      } catch (e: any) {
        debug(e.message)
      }
    }
    return super.handle(message, context)
  }
}
