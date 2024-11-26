import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { ExpressBuilder, ExpressSupport } from '@sphereon/ssi-express-support'
import { TAgent } from '@veramo/core'
import { IOIDFMetadataStore } from '../src'
import { DataSource } from 'typeorm'
import oidfMetadataServerAgentLogic from './shared/OidfMetadataServerAgentLogic'

let dbConnection: Promise<DataSource>
let agent: TAgent<IOIDFMetadataStore>

const setup = async (): Promise<ExpressSupport> => {
  const config = await getConfig('packages/oidf-metadata-server/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent as TAgent<IOIDFMetadataStore>
  dbConnection = db

  const builder = ExpressBuilder.fromServerOpts({
    port: 3333,
    hostname: '127.0.0.1',
  })
    .withMorganLogging({ format: 'dev' })
    .withPassportAuth(false)

  return builder.build({ startListening: false })
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).close()
  return true
}

const getAgent = () => agent

interface TestContext {
  getAgent: () => TAgent<IOIDFMetadataStore>
  setup: () => Promise<ExpressSupport>
  tearDown: () => Promise<boolean>
}

const testContext: TestContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', (): void => {
  oidfMetadataServerAgentLogic(testContext)
})
