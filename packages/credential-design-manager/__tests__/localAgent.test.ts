import { createObjects, getConfig } from '../../agent-config/dist'
import { TAgent } from '@veramo/core'
import { DataSource } from 'typeorm'

import { describe } from 'vitest'
import { ICredentialDesignManager } from '../src'
import credentialDesignManagerAgentLogic from './shared/credentialDesignManagerAgentLogic'

let dbConnection: Promise<DataSource>
let agent: TAgent<ICredentialDesignManager>

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/credential-design-manager/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent as TAgent<ICredentialDesignManager>
  dbConnection = db

  return true
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection)?.close()
  return true
}

const getAgent = () => agent
const testContext = {
  getAgent,
  setup,
  tearDown,
}

describe('Local integration tests', (): void => {
  credentialDesignManagerAgentLogic(testContext)
})
