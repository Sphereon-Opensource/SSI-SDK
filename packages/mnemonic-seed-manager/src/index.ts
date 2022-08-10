import { MnemonicEntity } from './entities/MnemonicEntity'

const schema = require('../plugin.schema.json')
export { schema }
export { MnemonicSeedManager } from './agent/MnemonicSeedManager'
export * from './types/IMnemonicSeedManager'
export const MnemonicSeedManagerEntities = [MnemonicEntity]
export { MnemonicSeedManagerMigrations } from './migrations'
