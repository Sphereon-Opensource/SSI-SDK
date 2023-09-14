import { createAgent } from '@veramo/core'
import { DataStore, DataStoreORM } from '@veramo/data-store'
import { IRequiredPlugins } from '../src'
import { DB_CONNECTION_NAME, sqliteConfig } from './database'
import { ContactManager } from '@sphereon/ssi-sdk.contact-manager'
import { ContactStore, PartyTypeEnum } from '@sphereon/ssi-sdk.data-store'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { v4 } from 'uuid'

const dbConnection = DataSources.singleInstance()
  .addConfig(DB_CONNECTION_NAME, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME)

const agent = createAgent<IRequiredPlugins>({
  plugins: [new DataStore(dbConnection), new DataStoreORM(dbConnection), new ContactManager({ store: new ContactStore(dbConnection) })],
})

agent.cmAddContactType({
  name: "people",
  type: PartyTypeEnum.NATURAL_PERSON,
  tenantId: v4()
}).then(ct=> {
  agent.cmAddContact({
    firstName: "Abraham",
    middleName: "Gerrit Jan",
    lastName: "ten Cate",
    displayName: "Bram ten Cate",
    contactType: ct,
    uri: "example.com"
  })
  agent.cmAddContact({
    firstName: "Kraak",
    middleName: "en",
    lastName: "Smaak",
    displayName: "Kraak en Smaak",
    contactType: ct,
    uri: "example.com"
  })
}).catch(e => {
  console.log(e)
})
agent.cmAddContactType({
  name: "orgzanizations",
  type: PartyTypeEnum.ORGANIZATION,
  tenantId: v4()
}).then(ct=> {
  agent.cmAddContact({
    legalName: "Sphereon International",
    displayName: "Sphereon B.V.",
    contactType: ct,
    uri: "sphereon.com"
  })
  agent.cmAddContact({
    legalName: "Kamer van verkoophandel",
    displayName: "Kamer van koophandel",
    contactType: ct,
    uri: "kvk.nl"
  })
}).catch(e=> {
  console.log(e)
})
export default agent
