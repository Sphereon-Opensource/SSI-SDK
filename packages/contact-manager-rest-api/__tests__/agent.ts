import { createAgent, IIdentifier } from '@veramo/core'
import { DataStore, DataStoreORM, DIDStore } from '@veramo/data-store'
import { IRequiredPlugins } from '../src'
import { DB_CONNECTION_NAME, sqliteConfig } from './database'
import { AddContactArgs, ContactManager } from '@sphereon/ssi-sdk.contact-manager'
import {
  ContactStore,
  CorrelationIdentifierType,
  CredentialRole,
  NonPersistedIdentity,
  PartyOrigin,
  PartyTypeType,
} from '@sphereon/ssi-sdk.data-store'
import { DataSources } from '@sphereon/ssi-sdk.agent-config'
import { v4 } from 'uuid'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { IonDIDProvider } from '@veramo/did-provider-ion'
import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'

export const DID_PREFIX = 'did'

const PRIVATE_RECOVERY_KEY_HEX = 'd39e66e720c00b244923eb861122ed25116555ae771ee9a57b749640173d7cf8'
const PRIVATE_UPDATE_KEY_HEX = '0121009becfa9caf6221dce6f4f7b55dd3376e79c4ca83ce92bd43861c2393ec'
const PRIVATE_DID1_KEY_HEX = 'e0453c226bd4458740c45f0d0590e696da2fe9c5c66f81908aedd43a7b7da252'
const PRIVATE_DID2_KEY_HEX = '74213f5204ea414deb4dc2c470d1700b8cc2076ddd8d3ddb06dae08902dddd0c'
const PRIVATE_DID3_KEY_HEX = '90868704b3bb2bdd27e2e831654c4adb2ea7e4f0e090d03aa3ae38020346aa12'
const PRIVATE_DID4_KEY_HEX = 'f367873323bf0dd701ec972d8a17aee7a9dcad13bd6deb64e8653da113094261'
const PRIVATE_DID5_KEY_HEX = 'a1868704b3bb2bdd27e2e831654aeadb2ea7e4f0e090d03aa3ae38020346aa34'
const PRIVATE_DID6_KEY_HEX = 'a167873323bf0dd701ec972d8a17aee7aaecad13bd6deb64e8653da113094256'
export enum KeyManagementSystemEnum {
  LOCAL = 'local',
}

export enum SupportedDidMethodEnum {
  DID_ION = 'ion',
}

export const didProviders = {
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_ION}`]: new IonDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
}

const dbConnection = DataSources.singleInstance().addConfig(DB_CONNECTION_NAME, sqliteConfig).getDbConnection(DB_CONNECTION_NAME)

const agent = createAgent<IRequiredPlugins>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new ContactManager({ store: new ContactStore(dbConnection) }),
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: `${DID_PREFIX}:${SupportedDidMethodEnum.DID_ION}`,
      providers: didProviders,
    }),
  ],
})
const toContactIdentityDTO = (contact: Record<string, any>, identifier: IIdentifier): NonPersistedIdentity => {
  console.log(`Contact received did ${identifier.did}, contact: ${JSON.stringify(contact)}`)
  return {
    alias: identifier.alias,
    roles: [CredentialRole.ISSUER],
    identifier: {
      type: CorrelationIdentifierType.DID,
      correlationId: identifier.did,
    },
  } as NonPersistedIdentity
}

async function addContacts() {
  try {
    const personContactType = await agent.cmAddContactType({
      name: 'people',
      origin: PartyOrigin.EXTERNAL,
      type: PartyTypeType.NATURAL_PERSON,
      tenantId: v4(),
    })

    const organizationalContactType = await agent.cmAddContactType({
      name: 'organizations',
      origin: PartyOrigin.EXTERNAL,
      type: PartyTypeType.ORGANIZATION,
      tenantId: v4(),
    })

    const persona1 = {
      firstName: 'Wendy',
      middleName: 'van',
      lastName: 'RWS',
      displayName: 'Wendy van RWS',
      contactType: personContactType,
      uri: 'rijkswaterstaat.nl',
    } as AddContactArgs

    let identifier = await agent.didManagerCreate(existingDidConfig(false, 'wendy', PRIVATE_DID1_KEY_HEX))
    persona1.identities = [toContactIdentityDTO(persona1, identifier)]
    await agent.cmAddContact(persona1)
    // did:ion:EiDktcw2GgLHQe3WehFFKciKS6rjYNEmKFIs-4_knT-Lpg:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJ3ZW5keSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiI4N3U3NlRMVFhUT09paEo3RFZoYUloUUlmWkN4WjRja1pkNHNxaEw2OVVjIiwieSI6InlMMEFmUTdaNXBhQk9rTGh2X1h6M0QyY0oxaWdSNkVfZFViT2tSRmtZWDgifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpRElPNlE4M1p2MkFJR09Yb2dRbHVYbEpwNTc2WVNBOWc0dVF1MzVDRVc0Y3cifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUF1eEU4RGhndmhRbzlpZG5hODgycExpY0JQZzlNYTZIS25ENWJKZWJ5ZllBIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlDNVQ5aTVNSjVzRm9FaDg4cTdKa09qWUNQMXBEODR5ODBNSzRCZUJmeGJKZyJ9fQ

    const persona2 = {
      firstName: 'Hanne',
      middleName: 'van',
      lastName: 'Stonebase',
      displayName: 'Hanne van Stonebase',
      contactType: personContactType,
      uri: 'stonebase.nl',
    } as AddContactArgs

    identifier = await agent.didManagerCreate(existingDidConfig(false, 'hanne', PRIVATE_DID2_KEY_HEX))
    persona2.identities = [toContactIdentityDTO(persona2, identifier)]
    await agent.cmAddContact(persona2)
    // did:ion:EiAPtRGoWDBTgilTE3PhmSy0C7IxiL1-16hzv-il_l4dCQ:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJoYW5uZSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJKaUdNcXU3VFlUdUlOTzYyV0VzQjczeTA2eFlZQkJ0clN1d0RjM3k2dFowIiwieSI6Im0tZ2xJTXhEN0Q5Z1Zvc2Q3YjdMVmNMRUxWdFVUVDZWbGN2T3cyQUx6NVkifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpRElPNlE4M1p2MkFJR09Yb2dRbHVYbEpwNTc2WVNBOWc0dVF1MzVDRVc0Y3cifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaURpWjNGRmFkUTZTQWJLUDAwZFMza05LMWRoaV9OZTNncWNoNkRFdmZvcXFnIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlDNVQ5aTVNSjVzRm9FaDg4cTdKa09qWUNQMXBEODR5ODBNSzRCZUJmeGJKZyJ9fQ

    const persona3 = {
      firstName: 'Kees',
      middleName: 'van',
      lastName: 'SGS',
      displayName: 'Kees van SGS',
      contactType: personContactType,
      uri: 'sgs.com',
    } as AddContactArgs

    identifier = await agent.didManagerCreate(existingDidConfig(false, 'kees', PRIVATE_DID3_KEY_HEX))
    persona3.identities = [toContactIdentityDTO(persona3, identifier)]
    await agent.cmAddContact(persona3)
    // did:ion:EiBVz8Hb_8C3BGtUcFa73jbEnSANCGJvQqGNGaTjAmD4PA:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJrZWVzIiwicHVibGljS2V5SndrIjp7ImNydiI6InNlY3AyNTZrMSIsImt0eSI6IkVDIiwieCI6IjRqMzhYUEpRWnExWW0zTkV3ZHJSZFVzY3lUdEhkM25rbEJpN1E3NkxtZTgiLCJ5IjoieU1RYkJ5dTE1d1BrWlpTTWl1R2o5VjJWbDdCeUtnM2Rab3dlVE9CcURXQSJ9LCJwdXJwb3NlcyI6WyJhdXRoZW50aWNhdGlvbiIsImFzc2VydGlvbk1ldGhvZCJdLCJ0eXBlIjoiRWNkc2FTZWNwMjU2azFWZXJpZmljYXRpb25LZXkyMDE5In1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlESU82UTgzWnYyQUlHT1hvZ1FsdVhsSnA1NzZZU0E5ZzR1UXUzNUNFVzRjdyJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpRDhFTElBSkJaMDAwMkh6OHUwWVZhWURBbkhkN2d3NTU3M0lmeW1jQnY1ZVEiLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaUM1VDlpNU1KNXNGb0VoODhxN0prT2pZQ1AxcEQ4NHk4ME1LNEJlQmZ4YkpnIn19

    const organization1 = {
      legalName: 'Rijkswaterstaat',
      displayName: 'Rijkswaterstaat',
      contactType: organizationalContactType,
      uri: 'rijkswaterstaat.nl',
    } as AddContactArgs

    identifier = await agent.didManagerCreate(existingDidConfig(false, 'rws', PRIVATE_DID4_KEY_HEX))
    organization1.identities = [toContactIdentityDTO(organization1, identifier)]
    await agent.cmAddContact(organization1)
    // did:ion:EiCgT4nciFugDoVYcImyRBKAoDhTQXF3iHMyF6oS1cMqiA:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJyd3MiLCJwdWJsaWNLZXlKd2siOnsiY3J2Ijoic2VjcDI1NmsxIiwia3R5IjoiRUMiLCJ4IjoiWm5HbFAwT3F3QU9XTF9IZUlJSTZtczlLbkxCQXV2WnJtRjFPTzhnMkhBNCIsInkiOiJsd2Y4QXpmZ1lGXzU5RWRFYnhvQ1pOTXdTaVFRQ1NvY1hFQ0RtbmRfclhzIn0sInB1cnBvc2VzIjpbImF1dGhlbnRpY2F0aW9uIiwiYXNzZXJ0aW9uTWV0aG9kIl0sInR5cGUiOiJFY2RzYVNlY3AyNTZrMVZlcmlmaWNhdGlvbktleTIwMTkifV19fV0sInVwZGF0ZUNvbW1pdG1lbnQiOiJFaURJTzZRODNadjJBSUdPWG9nUWx1WGxKcDU3NllTQTlnNHVRdTM1Q0VXNGN3In0sInN1ZmZpeERhdGEiOnsiZGVsdGFIYXNoIjoiRWlDVjNUMkpuYTdMaVk4MVU2d2RhX1ZPX1VwcTU3eEtqeVh6R2JrME1xYTdUZyIsInJlY292ZXJ5Q29tbWl0bWVudCI6IkVpQzVUOWk1TUo1c0ZvRWg4OHE3SmtPallDUDFwRDg0eTgwTUs0QmVCZnhiSmcifX0

    const organization2 = {
      legalName: 'Stone Base B.V.',
      displayName: 'Stone Base',
      contactType: organizationalContactType,
      uri: 'stonebase.nl',
    } as AddContactArgs

    identifier = await agent.didManagerCreate(existingDidConfig(false, 'stonebase', PRIVATE_DID5_KEY_HEX))
    organization2.identities = [toContactIdentityDTO(organization2, identifier)]
    await agent.cmAddContact(organization2)
    // did:ion:EiAj_YiR0IaPqvA0fYVolNMArSROZTnypAxNvBwQlH53lg:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJzdG9uZWJhc2UiLCJwdWJsaWNLZXlKd2siOnsiY3J2Ijoic2VjcDI1NmsxIiwia3R5IjoiRUMiLCJ4IjoiQTAzV0RublU5N0syTWhzcy1zSno5TGl3d0RWdDRnRHp6N2lqbkwwLUtEayIsInkiOiJidzZFYjFZeHRvdThXay1BTzNlUVR6OEp3R25uYnFTR2tjcl94aTBRZVZjIn0sInB1cnBvc2VzIjpbImF1dGhlbnRpY2F0aW9uIiwiYXNzZXJ0aW9uTWV0aG9kIl0sInR5cGUiOiJFY2RzYVNlY3AyNTZrMVZlcmlmaWNhdGlvbktleTIwMTkifV19fV0sInVwZGF0ZUNvbW1pdG1lbnQiOiJFaURJTzZRODNadjJBSUdPWG9nUWx1WGxKcDU3NllTQTlnNHVRdTM1Q0VXNGN3In0sInN1ZmZpeERhdGEiOnsiZGVsdGFIYXNoIjoiRWlEaFF0N2ltc0VzeGs4WEJLSWoyc1RmcjJOMV9FallrYVRMWFlZNVBSS0hpdyIsInJlY292ZXJ5Q29tbWl0bWVudCI6IkVpQzVUOWk1TUo1c0ZvRWg4OHE3SmtPallDUDFwRDg0eTgwTUs0QmVCZnhiSmcifX0

    const organization3 = {
      legalName: 'SGS S.A.',
      displayName: 'SGS',
      contactType: organizationalContactType,
      uri: 'sgs.com',
    } as AddContactArgs

    identifier = await agent.didManagerCreate(existingDidConfig(false, 'sgs', PRIVATE_DID6_KEY_HEX))
    organization3.identities = [toContactIdentityDTO(organization3, identifier)]
    await agent.cmAddContact(organization3)
    // did:ion:EiDobUdzuIh5U8UDtbe6y-Zx1LpiO_AsqlsT-gMZa6vCvA:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJzZ3MiLCJwdWJsaWNLZXlKd2siOnsiY3J2Ijoic2VjcDI1NmsxIiwia3R5IjoiRUMiLCJ4IjoiamNhbm1FcC1HbU9QN1F6RjFkdlJ2YTkwSmRQQlFqTDNmQ1h5eWNmU3RyRSIsInkiOiJfV0FpMlplMWI4SFBLT1Zza2x1bWl3SE9wNW9MZnV1SzY1VmNieE5IejJvIn0sInB1cnBvc2VzIjpbImF1dGhlbnRpY2F0aW9uIiwiYXNzZXJ0aW9uTWV0aG9kIl0sInR5cGUiOiJFY2RzYVNlY3AyNTZrMVZlcmlmaWNhdGlvbktleTIwMTkifV19fV0sInVwZGF0ZUNvbW1pdG1lbnQiOiJFaURJTzZRODNadjJBSUdPWG9nUWx1WGxKcDU3NllTQTlnNHVRdTM1Q0VXNGN3In0sInN1ZmZpeERhdGEiOnsiZGVsdGFIYXNoIjoiRWlEQWgzN2dhOWMwaGFlVXd6R2tWam03aFJXSF82T19mdFJwWloyRnpmWHJJQSIsInJlY292ZXJ5Q29tbWl0bWVudCI6IkVpQzVUOWk1TUo1c0ZvRWg4OHE3SmtPallDUDFwRDg0eTgwTUs0QmVCZnhiSmcifX0
  } catch (e) {
    console.log(e)
  }
}

function existingDidConfig(anchor: boolean = false, kid: string, privateDIDKeyHex: String) {
  return {
    options: {
      anchor,
      recoveryKey: {
        kid: `recovery-key-${kid}`,
        key: {
          privateKeyHex: PRIVATE_RECOVERY_KEY_HEX,
        },
      },
      updateKey: {
        kid: `update-key-${kid}`,
        key: {
          privateKeyHex: PRIVATE_UPDATE_KEY_HEX,
        },
      },
      verificationMethods: [
        {
          kid,
          purposes: [IonPublicKeyPurpose.Authentication, IonPublicKeyPurpose.AssertionMethod],
          key: {
            privateKeyHex: privateDIDKeyHex,
          },
        },
      ],
    },
  }
}

addContacts()

export default agent
