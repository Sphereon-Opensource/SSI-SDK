import { createAgent } from '@veramo/core'
import { DataStore, DataStoreORM } from '@veramo/data-store'
import { IRequiredPlugins } from '../src'
import { DB_CONNECTION_NAME, getDbConnection } from './database'
import { ContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ContactStore } from '@sphereon/ssi-sdk.data-store'

const dbConnection = getDbConnection(DB_CONNECTION_NAME)

const agent = createAgent<IRequiredPlugins>({
  plugins: [new DataStore(dbConnection), new DataStoreORM(dbConnection), new ContactManager({ store: new ContactStore(dbConnection) })],
})

export default agent
