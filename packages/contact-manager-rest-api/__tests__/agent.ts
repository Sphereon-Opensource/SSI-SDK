import {createAgent, IIdentifier} from '@veramo/core'
import {DataStore, DataStoreORM, DIDStore} from '@veramo/data-store'
import {IRequiredPlugins} from '../src'
import {DB_CONNECTION_NAME, sqliteConfig} from './database'
import {AddContactArgs, ContactManager} from '@sphereon/ssi-sdk.contact-manager'
import {
    ContactStore,
    CorrelationIdentifierEnum,
    IdentityRoleEnum,
    NonPersistedIdentity,
    PartyTypeEnum
} from '@sphereon/ssi-sdk.data-store'
import {DataSources} from '@sphereon/ssi-sdk.agent-config'
import {v4} from 'uuid'
import {DIDManager} from "@veramo/did-manager";
import {KeyManager, MemoryKeyStore, MemoryPrivateKeyStore} from "@veramo/key-manager";
import {KeyManagementSystem} from "@veramo/kms-local";
import {IonDIDProvider} from "@veramo/did-provider-ion";
import {IonPublicKeyPurpose} from "@decentralized-identity/ion-sdk";

export const DID_PREFIX = 'did'
const dbConnection = DataSources.singleInstance()
    .addConfig(DB_CONNECTION_NAME, sqliteConfig)
    .getDbConnection(DB_CONNECTION_NAME)

const PRIVATE_RECOVERY_KEY_HEX = 'd39e66e720c00b244923eb861122ed25116555ae771ee9a57b749640173d7cf8'
const PRIVATE_UPDATE_KEY_HEX = '0121009becfa9caf6221dce6f4f7b55dd3376e79c4ca83ce92bd43861c2393ec'
const PRIVATE_DID1_KEY_HEX = 'e0453c226bd4458740c45f0d0590e696da2fe9c5c66f81908aedd43a7b7da252'
const PRIVATE_DID2_KEY_HEX = '74213f5204ea414deb4dc2c470d1700b8cc2076ddd8d3ddb06dae08902dddd0c'
const PRIVATE_DID3_KEY_HEX = '90868704b3bb2bdd27e2e831654c4adb2ea7e4f0e090d03aa3ae38020346aa12'
const PRIVATE_DID4_KEY_HEX = 'f367873323bf0dd701ec972d8a17aee7a9dcad13bd6deb64e8653da113094261'

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

const agent = createAgent<IRequiredPlugins>({
    plugins: [
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new ContactManager({store: new ContactStore(dbConnection)}),
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
const generateIdentity = (contact: Record<string, any>, didKeyIdentifier: IIdentifier): NonPersistedIdentity => {
    return {
        alias: didKeyIdentifier.alias,
        roles: [IdentityRoleEnum.ISSUER],
        identifier: {
            type: CorrelationIdentifierEnum.DID,
            correlationId: didKeyIdentifier.did,
        },
    } as NonPersistedIdentity
};

async function addContacts() {
    try {
        const ctPeople = await agent.cmAddContactType({
            name: "people",
            type: PartyTypeEnum.NATURAL_PERSON,
            tenantId: v4()
        });

        const ctOrganizations = await agent.cmAddContactType({
            name: "organizations",
            type: PartyTypeEnum.ORGANIZATION,
            tenantId: v4()
        });


        const persona1 = {
            firstName: "Viola",
            middleName: "D.",
            lastName: "Kemp",
            displayName: "Viola Kemp",
            contactType: ctPeople,
            uri: "example.com"
        } as AddContactArgs;

        let didKeyIdentifier = await agent.didManagerCreate(existingDidConfig(false, 'bram', PRIVATE_DID1_KEY_HEX));
        persona1.identities = [generateIdentity(persona1, didKeyIdentifier)];
        await agent.cmAddContact(persona1);

        const persona2 = {
            firstName: "Kevin",
            middleName: "T.",
            lastName: "Bloomer",
            displayName: "Kevin Bloomer",
            contactType: ctPeople,
            uri: "example.com"
        } as AddContactArgs;

        didKeyIdentifier = await agent.didManagerCreate(existingDidConfig(false, 'kraak', PRIVATE_DID2_KEY_HEX));
        persona2.identities = [generateIdentity(persona2, didKeyIdentifier)];
        await agent.cmAddContact(persona2);


        const organization1 = {
            legalName: "Sphereon International",
            displayName: "Sphereon B.V.",
            contactType: ctOrganizations,
            uri: "sphereon.com"
        } as AddContactArgs;

        didKeyIdentifier = await agent.didManagerCreate(existingDidConfig(false, 'sphereon', PRIVATE_DID3_KEY_HEX));
        organization1.identities = [generateIdentity(organization1, didKeyIdentifier)];
        await agent.cmAddContact(organization1);

        const organization2 = {
            legalName: "Kamer van verkoophandel",
            displayName: "Kamer van koophandel",
            contactType: ctOrganizations,
            uri: "kvk.nl"
        } as AddContactArgs;

        didKeyIdentifier = await agent.didManagerCreate(existingDidConfig(false, 'kvk', PRIVATE_DID4_KEY_HEX));
        organization2.identities = [generateIdentity(organization2, didKeyIdentifier)];
        await agent.cmAddContact(organization2);
    } catch (e) {
        console.log(e);
    }
}


function existingDidConfig(anchor: boolean = false, kid: string, privateDIDKeyHex: String) {
    return {
        options: {
            anchor,
            recoveryKey: {
                kid: 'recovery-test2',
                key: {
                    privateKeyHex: PRIVATE_RECOVERY_KEY_HEX,
                },
            },
            updateKey: {
                kid: 'update-test2',
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
