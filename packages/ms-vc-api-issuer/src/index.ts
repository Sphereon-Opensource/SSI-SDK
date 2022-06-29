import { createAgent, IDataStore, IDataStoreORM} from '@veramo/core'
import { 
  DataStore,
  DataStoreORM,
  Entities
} from '@veramo/data-store'
import { createConnection } from 'typeorm'
const schema = require('../plugin.schema.json')
export { schema }

const dbConnection = createConnection({
  type: 'sqlite',
  database: 'memory',
  entities: Entities
})

const agent = createAgent< IDataStore & IDataStoreORM >({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection)
  ]
})

export { MsVcApiIssuer } from './agent/MsVcApiIssuer'
export * from './types/IMsVcApiIssuer'
export default agent