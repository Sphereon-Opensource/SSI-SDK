/**
 * @public
 */
import schema from '../plugin.schema.json'
export { schema }
export { PDManager, pdManagerMethods } from './agent/PDManager'
export * from './types/IPDManager'

export type { ReleaseType } from 'semver'
export type { ImportDcqlQueryItem } from '@sphereon/ssi-sdk.data-store'
export type { DcqlQuery } from 'dcql'
