/**
 * Provides a {@link @veramo/credential-w3c#CredentialPlugin | plugin} for the {@link @veramo/core#Agent} that
 * implements
 * {@link @veramo/core#ICredentialIssuer} interface.
 *
 * Provides a {@link @veramo/credential-w3c#W3cMessageHandler | plugin} for the
 * {@link @veramo/message-handler#MessageHandler} that verifies Credentials and Presentations in a message.
 *
 * @packageDocumentation
 */
export type * from './types'
export { W3cMessageHandler, MessageTypes } from './message-handler'
import { VcdmCredentialPlugin } from './action-handler'

/**
 * @deprecated please use {@link VcdmCredentialPlugin} instead
 * @public
 */
const CredentialIssuer = VcdmCredentialPlugin
export { CredentialIssuer, VcdmCredentialPlugin }

// For backward compatibility, re-export the plugin types that were moved to core in v4
export type { ICredentialIssuer, ICredentialVerifier } from '@veramo/core'

export * from './functions'
