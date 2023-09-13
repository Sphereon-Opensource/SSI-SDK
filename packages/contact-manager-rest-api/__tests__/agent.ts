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
  name: `${v4()}-people`,
  type: PartyTypeEnum.NATURAL_PERSON,
  tenantId: v4()
}).then(ct=> {
  agent.cmAddContact({
    "firstName": "emp1_fn",
    "middleName": "emp1_mn",
    "lastName": "emp1_ln",
    "displayName": "emp1_dn",
    contactType: ct,
    uri: "emp1_url"
  })
  agent.cmAddContact({
    "firstName": "emp2_fn",
    "middleName": "emp2_mn",
    "lastName": "emp2_ln",
    "displayName": "emp2_dn",
    contactType: ct,
    uri: "emp2_url"
  })
  agent.cmAddContact({
    "firstName": "emp3_fn",
    "middleName": "emp3_mn",
    "lastName": "emp3_ln",
    "displayName": "emp3_dn",
    contactType: ct,
    uri: "emp2_url"
  })
})
agent.cmAddContactType({
  name: `${v4()}-orgzanizations`,
  type: PartyTypeEnum.ORGANIZATION,
  tenantId: v4()
}).then(ct=> {
  agent.cmAddContact({
    legalName: `${v4()}-org1_fn`,
    displayName: "org1_dn",
    contactType: ct,
    uri: "org1_uri"
  })
  agent.cmAddContact({
    legalName: `${v4()}-org2_fn`,
    displayName: "org2_dn",
    contactType: ct,
    uri: "org2_uri"
  })
})
export default agent
