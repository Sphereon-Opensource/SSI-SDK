import { createAgent } from '@veramo/core'
import { DataStore, DataStoreORM } from '@veramo/data-store'
import { IRequiredPlugins } from '../src'
import { DB_CONNECTION_NAME, sqliteConfig } from './database'
import { ContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ContactStore } from '@sphereon/ssi-sdk.data-store'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'

const dbConnection = DataSources.singleInstance()
  .addConfig(DB_CONNECTION_NAME, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME)

const agent = createAgent<IRequiredPlugins>({
  plugins: [new DataStore(dbConnection), new DataStoreORM(dbConnection), new ContactManager({ store: new ContactStore(dbConnection) })],
})

export default agent
