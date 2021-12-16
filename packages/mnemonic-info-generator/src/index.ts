import { MnemonicInfo } from './agent/entity/mnemonicInfo'

const schema = require('../plugin.schema.json')
export { schema }
export { MnemonicInfoGenerator } from './agent/MnemonicInfoGenerator'
export * from './types/IMnemonicInfoGenerator'
export const Entities = [MnemonicInfo]
