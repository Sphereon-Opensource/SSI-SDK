import { createAgent } from '@veramo/core'
import { DataStore, DataStoreORM } from '@veramo/data-store'
import { IRequiredPlugins } from '../src'
import { DB_CONNECTION_NAME, sqliteConfig } from './database'
import {AddContactArgs, ContactManager} from '@sphereon/ssi-sdk.contact-manager'
import {
  ContactStore,
  CorrelationIdentifierEnum,
  IdentityRoleEnum,
  NonPersistedIdentity,
  PartyTypeEnum
} from '@sphereon/ssi-sdk.data-store'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { v4 } from 'uuid'
import {bytesToBase58} from "@sphereon/ssi-sdk.core";

const dbConnection = DataSources.singleInstance()
  .addConfig(DB_CONNECTION_NAME, sqliteConfig)
  .getDbConnection(DB_CONNECTION_NAME)

const agent = createAgent<IRequiredPlugins>({
  plugins: [new DataStore(dbConnection), new DataStoreORM(dbConnection), new ContactManager({ store: new ContactStore(dbConnection) })],
})
const generateIdentity = (contact: Record<string, any>) : NonPersistedIdentity => {
  const encoder = new TextEncoder()
  const generatedKey = bytesToBase58(encoder.encode(contact['displayName']))
  return {
    alias: `alias_${generatedKey}`,
    roles: [IdentityRoleEnum.ISSUER],
    identifier: {
      type: CorrelationIdentifierEnum.DID,
      correlationId: 'did:key:' + generatedKey,
    },
  } as NonPersistedIdentity
};

agent.cmAddContactType({
  name: "people",
  type: PartyTypeEnum.NATURAL_PERSON,
  tenantId: v4()
}).then(ct=> {
  const bram = {
    firstName: "Abraham",
    middleName: "Gerrit Jan",
    lastName: "ten Cate",
    displayName: "Bram ten Cate",
    contactType: ct,
    uri: "example.com"
  } as AddContactArgs
  bram.identities = [generateIdentity(bram)]
  agent.cmAddContact(bram)

  const kraak = {
    firstName: "Kraak",
    middleName: "en",
    lastName: "Smaak",
    displayName: "Kraak en Smaak",
    contactType: ct,
    uri: "example.com",
  } as AddContactArgs;
  kraak.identities = [generateIdentity(kraak)]
  agent.cmAddContact(kraak)
}).catch(e => {
  console.log(e)
})
agent.cmAddContactType({
  name: "organizations",
  type: PartyTypeEnum.ORGANIZATION,
  tenantId: v4()
}).then(ct=> {
  const sphereon = {
    legalName: "Sphereon International",
    displayName: "Sphereon B.V.",
    contactType: ct,
    uri: "sphereon.com"
  } as AddContactArgs;
  sphereon.identities = [generateIdentity(sphereon)]
  agent.cmAddContact(sphereon)

  const kvk = {
    legalName: "Kamer van verkoophandel",
    displayName: "Kamer van koophandel",
    contactType: ct,
    uri: "kvk.nl"
  } as AddContactArgs;
  kvk.identities = [generateIdentity(kvk)]
  agent.cmAddContact(kvk)
}).catch(e=> {
  console.log(e)
})
export default agent
