import { MnemonicInfo } from './agent/entity/MnemonicInfo'

const schema = require('../plugin.schema.json')
export { schema }
export { MnemonicSeedManager } from './agent/MnemonicSeedManager'
export * from './types/IMnemonicSeedManager'
export const Entities = [MnemonicInfo]
