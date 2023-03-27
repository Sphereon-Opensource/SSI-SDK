import { MnemonicEntity } from './entities/MnemonicEntity'

/**
 * @internal
 */
const schema = require('../plugin.schema.json')
export { schema }
/**
 * @public
 */
export { MnemonicSeedManager } from './agent/MnemonicSeedManager'
export * from './types/IMnemonicSeedManager'

/**
 * @internal
 */
export const MnemonicSeedManagerEntities = [MnemonicEntity]

/**
 * @internal
 */
export { MnemonicSeedManagerMigrations } from './migrations'
