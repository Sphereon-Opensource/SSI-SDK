import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'
import { getUniResolver } from '@sphereon/did-uni-client'
import { CredentialIssuerMetadata } from '@sphereon/oid4vci-common'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { OID4VCIIssuer } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { OID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import {
  CredentialHandlerLDLocal,
  LdDefaultContexts,
  MethodNames,
  SphereonBbsBlsSignature2020,
  SphereonEd25519Signature2018,
  SphereonEd25519Signature2020,
  SphereonJsonWebSignature2020,
} from '@sphereon/ssi-sdk.vc-handler-ld-local'
import { createAgent } from '@veramo/core'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DataStore, DataStoreORM, DIDStore, KeyStore, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { getDidIonResolver, IonDIDProvider } from '@veramo/did-provider-ion'
import { getDidKeyResolver, KeyDIDProvider } from '@veramo/did-provider-key'
import { WebDIDProvider } from '@veramo/did-provider-web'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import Debug from 'debug'
import { Resolver } from 'did-resolver'
import { getResolver as getDidWebResolver } from 'web-did-resolver'
import { IPlugins } from '../src'
import { DB_CONNECTION_NAME, DB_ENCRYPTION_KEY, getDbConnection } from './database'
import { start } from './RestAPI'
// import {toJwk} from "@sphereon/ssi-sdk-ext.key-utils";

const debug = Debug('ssi-sdk-siopv2-oid4vp-rp-rest-api')

export const DIF_UNIRESOLVER_RESOLVE_URL = 'https://dev.uniresolver.io/1.0/identifiers'
export const APP_ID = 'sphereon:rp-demo'
export const DID_PREFIX = 'did'

export enum KeyManagementSystemEnum {
  LOCAL = 'local',
}

export enum SupportedDidMethodEnum {
  DID_ETHR = 'ethr',
  DID_KEY = 'key',
  // DID_LTO = 'lto',
  DID_ION = 'ion',
  // DID_FACTOM = 'factom',
  DID_JWK = 'jwk',
  DID_WEB = 'web',
}

// const HOSTNAME = 'dbc2023.test.sphereon.com'
// const RP_DID_WEB = `did:web:${HOSTNAME}`
// const RP_DID_WEB_KID = `${RP_DID_WEB}#auth-key`

const RP_DID_JWK =
  'did:jwk:eyJhbGciOiJFUzI1NksiLCJ1c2UiOiJzaWciLCJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJCaXJGX0xROGtaOHVFREdxQzdSeXlUWGFRNEswelIyRE9VcF82NnN1R0xnIiwieSI6ImxUdnZMbTRlMmdSTzhmSm1ZQUp2dl8tTlpVMkk1Qjdtb3VJU2ZEZ3M3bjAifQ'

const RP_DID_JWK_PRIVATE_KEY_HEX = '63d619effd0f223dcfa4f0bcdcf11a9cd9c5ececda354848261abd3a80a2911841' // generatePrivateKeyHex('Secp256k1')
console.log(RP_DID_JWK_PRIVATE_KEY_HEX)
const RP_ION_PRIVATE_KEY_HEX = '851eb04ca3e2b2589d6f6a7287565816ee8e3126599bfeede8d3e93c53fb26e3'

const RP_DID_ION =
  'did:ion:EiAeobpQwEVpR-Ib9toYwbISQZZGIBck6zIUm0ZDmm9v0g:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJhdXRoLWtleSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJmUUE3WUpNRk1qNXFET0RrS25qR1ZLNW0za1VSRFc1YnJ1TWhUa1NYSGQwIiwieSI6IlI3cVBNNEsxWHlqNkprM3M2a3I2aFNrQzlDa0ExSEFpMVFTejZqSU56dFkifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpQnpwN1loTjltaFVjWnNGZHhuZi1sd2tSVS1oVmJCdFpXc1ZvSkhWNmprd0EifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUJvbWxvZ0JPOERROFdpVVFsa3diYmxuMXpsRFU2Q3Jvc01wNDRySjYzWHhBIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlEQVFYU2k3SGNqSlZCWUFLZE8yenJNNEhmeWJtQkJDV3NsNlBRUEpfamtsQSJ9fQ'
const PRIVATE_RECOVERY_KEY_HEX = '7c90c0575643d09a370c35021c91e9d8af2c968c5f3a4bf73802693511a55b9f'
const PRIVATE_UPDATE_KEY_HEX = '7288a92f6219c873446abd1f8d26fcbbe1caa5274b47f6f086ef3e7e75dcad8b'
// const RP_DID_ION_KID = `${RP_DID_ION}#auth-key`

export const resolver = new Resolver({
  ...getDidKeyResolver(),
  ...getDidWebResolver(),
  ...getUniResolver('ethr', {
    resolveUrl: DIF_UNIRESOLVER_RESOLVE_URL,
  }),
  ...getDidKeyResolver(),
  // ...getDidJwkResolver(),
  ...getUniResolver('jwk', {
    resolveUrl: DIF_UNIRESOLVER_RESOLVE_URL,
  }),
  ...getDidIonResolver(),
})

export const didProviders = {
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_ETHR}`]: new EthrDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
    network: 'ropsten',
  }),
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_KEY}`]: new KeyDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_ION}`]: new IonDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_WEB}`]: new WebDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`]: new JwkDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
}

const dbConnection = getDbConnection(DB_CONNECTION_NAME)
const privateKeyStore: PrivateKeyStore = new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))

const agent = createAgent<IPlugins>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(privateKeyStore),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: `${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`,
      providers: didProviders,
    }),
    new DIDResolverPlugin({
      resolver,
    }),
    new OID4VCIStore({
      defaultOpts: {
        userPinRequired: false,
        didOpts: {
          identifierOpts: {
            identifier: RP_DID_JWK,
            kid: '04062ac5fcb43c919f2e1031aa0bb472c935da4382b4cd1d83394a7febab2e18b8953bef2e6e1eda044ef1f26660026fbfff8d654d88e41ee6a2e2127c382cee7d',
          },
        },
      },
      importMetadatas: [
        {
          correlationId: 'https://oid4vci.ngrok.dev/test',
          overwriteExisting: true,
          metadata: {
            credential_issuer: 'https://oid4vci.ngrok.dev/test',
            credential_endpoint: 'https://oid4vci.ngrok.dev/test/credentials',
            // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
            display: [
              {
                name: 'Sphereon Issuer',
                description: 'Example OID4VCI Issuer',
              },
            ],
            credentials_supported: [
              {
                display: [
                  {
                    name: 'Example Credential',
                    description: 'Example Credential',
                  },
                ],
                id: 'test',
                types: ['VerifiableCredential'],
                format: 'jwt_vc_json',
                cryptographic_binding_methods_supported: ['did:web', 'did:jwk', 'did:key'],
                cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
              },
            ],
          } as CredentialIssuerMetadata,
        },
        {
          correlationId: 'https://oid4vci.ngrok.dev/dbc2023',
          overwriteExisting: true,
          metadata: {
            credential_issuer: 'https://oid4vci.ngrok.dev/dbc2023',
            credential_endpoint: 'https://oid4vci.ngrok.dev/dbc2023/credentials',
            // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
            display: [
              {
                name: 'Dutch Blockchain',
                description: 'Dutch Blockchain Issuer',
              },
            ],
            credentials_supported: [
              {
                display: [
                  {
                    name: 'Conference Attendee',
                    description: 'The DBC Conference Attendee credential is given to all visitors of the DBC conference.',
                    background_color: '#3B6F6D',
                    text_color: '#FFFFFF',
                    logo: {
                      url: 'https://dutchblockchaincoalition.org/assets/images/icons/Logo-DBC.png',
                      alt_text:
                        'An orange block shape, with the text Dutch Blockchain Coalition next to it, portraying the logo of the Dutch Blockchain Coalition.',
                    },
                  },
                  {
                    locale: 'en-US',
                    name: 'Conference Attendee',
                    description: 'The DBC Conference Attendee credential is given to all visitors of the DBC conference.',
                    background_color: '#3B6F6D',
                    text_color: '#FFFFFF',
                    logo: {
                      url: 'https://dutchblockchaincoalition.org/assets/images/icons/Logo-DBC.png',
                      alt_text:
                        'An orange block shape, with the text Dutch Blockchain Coalition next to it, portraying the logo of the Dutch Blockchain Coalition.',
                    },
                  },
                  {
                    locale: 'nl-NL',
                    name: 'Conferentie Deelnemer',
                    description: 'De DBC Conferentie Deelnemer credential wordt uitgegeven aan alle bezoekers van de DBC conferentie.',
                    background_color: '#3B6F6D',
                    text_color: '#FFFFFF',
                    logo: {
                      url: 'https://dutchblockchaincoalition.org/assets/images/icons/Logo-DBC.png',
                      alt_text:
                        'Een blok in de kleur oranje, met de text Dutch Blockchain Coalition ernaast, dat het logo van de Dutch Blockchain Coalition weergeeft.',
                    },
                  },
                ],
                order: ['name', 'email'],
                credentialSubject: {
                  name: {
                    value_type: 'string',
                    display: [
                      {
                        name: 'Name',
                        locale: 'en-US',
                      },
                      {
                        name: 'Naam',
                        locale: 'nl-NL',
                      },
                    ],
                  },
                  email: {
                    value_type: 'string',
                    display: [
                      {
                        name: 'Email',
                        locale: 'en-US',
                      },
                      {
                        name: 'Email',
                        locale: 'nl-NL',
                      },
                    ],
                  },
                },
                id: 'dbc2023',
                types: ['VerifiableCredential', 'DBCConferenceAttendee'],
                format: 'jwt_vc_json',
                cryptographic_binding_methods_supported: ['did:web', 'did:jwk'],
                cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
              },
            ],
          } as CredentialIssuerMetadata,
        },
      ],
    }),
    new OID4VCIIssuer({
      resolveOpts: {
        resolver,
      },
    }),
    new CredentialPlugin(),
    new CredentialHandlerLDLocal({
      contextMaps: [LdDefaultContexts],
      suites: [
        new SphereonEd25519Signature2018(),
        new SphereonEd25519Signature2020(),
        new SphereonBbsBlsSignature2020(),
        new SphereonJsonWebSignature2020(),
      ],
      bindingOverrides: new Map([
        ['createVerifiableCredentialLD', MethodNames.createVerifiableCredentialLDLocal],
        ['createVerifiablePresentationLD', MethodNames.createVerifiablePresentationLDLocal],
      ]),
      keyStore: privateKeyStore,
    }),
  ],
})

agent
  .didManagerGet({ did: RP_DID_JWK })
  .then((id) => {
    console.log(
      `==DID JWK existed:  \r\n${JSON.stringify(id, null, 2)}\r\nJWK:\r\n${JSON.stringify(toJwk(id.keys[0].publicKeyHex, 'Secp256k1'), null, 2)}`
    )
  })
  .catch((error) => {
    agent
      .didManagerCreate({
        provider: 'did:jwk',
        alias: 'oid4vci-jwk',
        options: {
          key: {
            privateKeyHex: RP_DID_JWK_PRIVATE_KEY_HEX,
          },
        },
      })
      .then((id) => console.log(`==>DID JWK created: \r\n${JSON.stringify(id, null, 2)}`))
      .catch((e) => console.error(`==>DID JWK ERROR: ${e.message}`))
  })
  .then(() => start())
agent
  .didManagerCreate({
    provider: 'did:ion',
    alias: RP_DID_ION,
    options: {
      kid: 'auth-key',
      anchor: false,
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
          key: {
            kid: 'auth-key',
            privateKeyHex: RP_ION_PRIVATE_KEY_HEX,
          },
          purposes: [IonPublicKeyPurpose.Authentication, IonPublicKeyPurpose.AssertionMethod],
        },
      ],
    },
  })
  .then((value) => {
    debug(`IDENTIFIER: ${value.did}`)
  })
  .catch((reason) => {
    debug(`error on creation:  ${reason}`)
  })
export default agent
