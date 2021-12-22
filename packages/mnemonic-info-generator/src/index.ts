import { MnemonicInfo } from './agent/entity/MnemonicInfo'

const schema = require('../plugin.schema.json')
export { schema }
export { MnemonicInfoGenerator } from './agent/MnemonicInfoGenerator'
export * from './types/IMnemonicInfoGenerator'
export const Entities = [MnemonicInfo]
