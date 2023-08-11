import { Command } from 'commander'
import module from 'module'
import { dev } from './dev.mjs'

const requireCjs = module.createRequire(import.meta.url)
const { version } = requireCjs('../package.json')

const sphereon = new Command('sphereon').version(version, '-v, --version').addCommand(dev)

export { sphereon }
