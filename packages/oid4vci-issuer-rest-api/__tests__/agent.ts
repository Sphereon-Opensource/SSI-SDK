import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'
import { getUniResolver } from '@sphereon/did-uni-client'
import { IssuerMetadata } from '@sphereon/oid4vci-common'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { OID4VCIIssuer } from '@sphereon/ssi-sdk.oid4vci-issuer'
import { OID4VCIStore } from '@sphereon/ssi-sdk.oid4vci-issuer-store'
import {
  CredentialHandlerLDLocal,
  LdDefaultContexts,
  MethodNames,
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
import { SecretBox } from '@veramo/kms-local'
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

export const baseUrl = 'https://oid4vci.ngrok.dev'

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
  'did:jwk:eyJhbGciOiJFUzI1NiIsInVzZSI6InNpZyIsImt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoiVEcySDJ4MmRXWE4zdUNxWnBxRjF5c0FQUVZESkVOX0gtQ010YmdqYi1OZyIsInkiOiI5TThOeGQwUE4yMk05bFBEeGRwRHBvVEx6MTV3ZnlaSnM2WmhLSVVKMzM4In0'

const RP_DID_JWK_PRIVATE_KEY_HEX = 'f4446e5eb1201a7769cb35f02f24b06c0ac3ff49eb085f8562f06fc6c42e68cd' /*generatePrivateKeyHex('Secp256r1')*/
console.log('=============' + RP_DID_JWK_PRIVATE_KEY_HEX)
const RP_ION_PRIVATE_KEY_HEX = '851eb04ca3e2b2589d6f6a7287565816ee8e3126599bfeede8d3e93c53fb26e3'

const RP_DID_ION =
  'did:ion:EiAeobpQwEVpR-Ib9toYwbISQZZGIBck6zIUm0ZDmm9v0g:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJhdXRoLWtleSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJmUUE3WUpNRk1qNXFET0RrS25qR1ZLNW0za1VSRFc1YnJ1TWhUa1NYSGQwIiwieSI6IlI3cVBNNEsxWHlqNkprM3M2a3I2aFNrQzlDa0ExSEFpMVFTejZqSU56dFkifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpQnpwN1loTjltaFVjWnNGZHhuZi1sd2tSVS1oVmJCdFpXc1ZvSkhWNmprd0EifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUJvbWxvZ0JPOERROFdpVVFsa3diYmxuMXpsRFU2Q3Jvc01wNDRySjYzWHhBIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlEQVFYU2k3SGNqSlZCWUFLZE8yenJNNEhmeWJtQkJDV3NsNlBRUEpfamtsQSJ9fQ'
const PRIVATE_RECOVERY_KEY_HEX = '7c90c0575643d09a370c35021c91e9d8af2c968c5f3a4bf73802693511a55b9f'
const PRIVATE_UPDATE_KEY_HEX = '7288a92f6219c873446abd1f8d26fcbbe1caa5274b47f6f086ef3e7e75dcad8b'
const RP_DID_ION_KID = `${RP_DID_ION}#auth-key`

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

let importMetadatas = [
  {
    correlationId: `${baseUrl}/sphereon`,
    overwriteExisting: true,
    // @ts-ignore
    metadata: {
      credential_issuer: `${baseUrl}/sphereon`,
      credential_endpoint: `${baseUrl}/sphereon/credentials`,
      // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
      display: [
        {
          name: 'Sphereon',
          description: 'Sphereon Example OID4VCI Issuer',
        },
      ],
      credentials_supported: [
        {
          display: [
            {
              name: 'Verified Employee',
              description: 'Verified Employee Example',
              logo: {
                url: 'https://sphereon.com/content/themes/sphereon/assets/img/logo-wit.svg',
                alt_text: 'A red rectangular shape, portraying the logo of Sphereon.',
              },
            },
          ],
          id: 'verified-employee',
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          types: ['VerifiableCredential', 'VerifiedEmployee'],
          format: 'jwt_vc_json',
          cryptographic_binding_methods_supported: ['did:web', 'did:ion', 'did:jwk'],
          cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
        },
        {
          display: [
            {
              name: 'Example Membership',
              description: 'Example Membership',
              logo: {
                url: 'https://sphereon.com/content/themes/sphereon/assets/img/logo-wit.svg',
                alt_text: 'An red rectangular shape, portraying the logo of Sphereon.',
              },
            },
          ],
          id: 'membership-example',
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          types: ['VerifiableCredential', 'MembershipExample'],
          format: 'jwt_vc_json',
          cryptographic_binding_methods_supported: ['did:web', 'did:ion', 'did:jwk', 'did:key'],
          cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
        },
      ],
    } as IssuerMetadata,
  },

  {
    correlationId: `${baseUrl}/dbc2023`,
    overwriteExisting: true,
    // @ts-ignore
    metadata: {
      credential_issuer: `${baseUrl}/dbc2023`,
      credential_endpoint: `${baseUrl}/dbc2023/credentials`,
      // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
      display: [
        {
          name: 'Dutch Blockchain Coalition',
          description: 'Dutch Blockchain Coalition Issuer',
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
              background_image: {
                url: 'https://i.ibb.co/CHqjxrJ/dbc-card-hig-res.png',
                alt_text: 'Connected open cubes in blue with one orange cube as a background of the card',
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
              background_image: {
                url: 'https://i.ibb.co/CHqjxrJ/dbc-card-hig-res.png',
                alt_text: 'Connected open cubes in blue with one orange cube as a background of the card',
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
                  'Aaneengesloten open blokken in de kleur blauw, met een blok in de kleur oranje, die tesamen de achtergrond van de kaart vormen.',
              },
              background_image: {
                url: 'https://i.ibb.co/CHqjxrJ/dbc-card-hig-res.png',
                alt_text: 'Connected open cubes in blue with one orange cube as a background of the card',
              },
            },
          ],
          order: ['firstName', 'lastName', 'email'],
          credentialSubject: {
            firstName: {
              value_type: 'string',
              display: [
                {
                  name: 'FirstName',
                },
                {
                  name: 'FirstName',
                  locale: 'en-US',
                },
                {
                  name: 'Voornaam',
                  locale: 'nl-NL',
                },
              ],
            },
            lastName: {
              value_type: 'string',
              display: [
                {
                  name: 'LastName',
                },
                {
                  name: 'LastName',
                  locale: 'en-US',
                },
                {
                  name: 'Achternaam',
                  locale: 'nl-NL',
                },
              ],
            },
            email: {
              value_type: 'string',
              display: [
                {
                  name: 'Email',
                },
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
    } as IssuerMetadata,
  },
  {
    correlationId: `${baseUrl}/fma2023`,
    overwriteExisting: true,
    // @ts-ignore
    metadata: {
      credential_issuer: `${baseUrl}/fma2023`,
      credential_endpoint: `${baseUrl}/fma2023/credentials`,
      // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
      display: [
        {
          name: 'Future Mobility Alliance',
          description: 'Future Data Market Place Issuer',
        },
      ],
      credentials_supported: [
        {
          display: [
            {
              name: 'FMA Guest',
              description: 'Future Mobility Data Marketplace Guest credential for demo purposes.',
              background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/P9SpRDX/fmdm.png',
                alt_text: 'Multiple green bikes in a row as the card background',
              },
              logo: {
                url: 'https://i.ibb.co/vkfZCvr/FMDM-card-logo.png',
                alt_text:
                  'A green and blue circle shape, with the text Future Mobility Data Marketplace next to it, portraying the logo of the Future Mobility Alliance.',
              },
            },
            {
              locale: 'en-US',
              name: 'FMA Guest',
              description: 'Future Mobility Data Marketplace Guest credential for demo purposes.',
              background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/P9SpRDX/fmdm.png',
                alt_text: 'Multiple green bikes in a row as the card background',
              },
              logo: {
                url: 'https://i.ibb.co/vkfZCvr/FMDM-card-logo.png',
                alt_text:
                  'A green and blue circle shape, with the text Future Mobility Data Marketplace next to it, portraying the logo of the Future Mobility Alliance.',
              },
            },
            {
              locale: 'nl-NL',
              name: 'FMA gast',
              description: 'Future Mobility Alliance gast credential wordt uitgegeven voor demo doeleinden.',
              background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/P9SpRDX/fmdm.png',
                alt_text: 'Meerdere groene fietsen op een rij die samen de kaart achtergrond vormen',
              },
              logo: {
                url: 'https://i.ibb.co/vkfZCvr/FMDM-card-logo.png',
                alt_text:
                  'An green and blue circle shape, with the text Future Mobility Data Marketplace next to it, portraying the logo of the Future Mobility Alliance.',
              },
            },
          ],
          order: ['firstName', 'lastName', 'email', 'type'],
          credentialSubject: {
            firstName: {
              value_type: 'string',
              display: [
                {
                  name: 'FirstName',
                },
                {
                  name: 'FirstName',
                  locale: 'en-US',
                },
                {
                  name: 'Voornaam',
                  locale: 'nl-NL',
                },
              ],
            },
            lastName: {
              value_type: 'string',
              display: [
                {
                  name: 'LastName',
                },
                {
                  name: 'LastName',
                  locale: 'en-US',
                },
                {
                  name: 'Achternaam',
                  locale: 'nl-NL',
                },
              ],
            },
            email: {
              value_type: 'string',
              display: [
                {
                  name: 'Email',
                },
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
            type: {
              value_type: 'string',
              display: [
                {
                  name: 'Type',
                },
                {
                  name: 'Type',
                  locale: 'en-US',
                },
                {
                  name: 'Type',
                  locale: 'nl-NL',
                },
              ],
            },
          },
          id: 'fma2023',
          types: ['VerifiableCredential', 'GuestCredential'],
          format: 'jwt_vc_json',
          cryptographic_binding_methods_supported: ['did:web', 'did:jwk'],
          cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
        },
      ],
    } as IssuerMetadata,
  },
  {
    correlationId: `${baseUrl}/triall2023`,
    overwriteExisting: true,
    // @ts-ignore
    metadata: {
      credential_issuer: `${baseUrl}/triall2023`,
      credential_endpoint: `${baseUrl}/triall2023/credentials`,
      // token_endpoint: 'https://oid4vci.ngrok.dev/test/token',
      display: [
        {
          name: 'Triall',
          description: 'Triall (Clinblocks B.V.) Issuer',
        },
      ],
      credentials_supported: [
        {
          display: [
            {
              name: 'Triall guest',
              description: 'Triall guest credential for demo purposes.',
              // background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/8dVhGJj/Triall.png',
                alt_text: 'Depicting a syringe being filled from a bottle ',
              },
              logo: {
                url: 'https://i.ibb.co/WV6Rmsj/triall-White.png',
                alt_text:
                  '9 white circles of which 5 are connected in a rectangular shape, with the text Triall next to it, portraying the logo of Triall.',
              },
            },
            {
              locale: 'en-US',
              name: 'Triall guest',
              description: 'Triall guest credential for demo purposes.',
              // background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/8dVhGJj/Triall.png',
                alt_text: 'Depicting a syringe being filled from a bottle ',
              },
              logo: {
                url: 'https://i.ibb.co/WV6Rmsj/triall-White.png',
                alt_text:
                  '9 white circles of which 5 are connected in a rectangular shape, with the text Triall next to it, portraying the logo of Triall.',
              },
            },
            {
              locale: 'nl-NL',
              name: 'Triall gast',
              description: 'Triall gast credential wordt uitgegeven voor demo doeleinden.',
              // background_color: '#3B6F6D',
              text_color: '#FFFFFF',
              background_image: {
                url: 'https://i.ibb.co/8dVhGJj/Triall.png',
                alt_text: 'Depicting a syringe being filled from a bottle ',
              },
              logo: {
                url: 'https://i.ibb.co/WV6Rmsj/triall-White.png',
                alt_text:
                  '9 white circles of which 5 are connected in a rectangular shape, with the text Triall next to it, portraying the logo of Triall.',
              },
            },
          ],
          order: ['firstName', 'lastName', 'email', 'type'],
          credentialSubject: {
            firstName: {
              value_type: 'string',
              display: [
                {
                  name: 'FirstName',
                },
                {
                  name: 'FirstName',
                  locale: 'en-US',
                },
                {
                  name: 'Voornaam',
                  locale: 'nl-NL',
                },
              ],
            },
            lastName: {
              value_type: 'string',
              display: [
                {
                  name: 'LastName',
                },
                {
                  name: 'LastName',
                  locale: 'en-US',
                },
                {
                  name: 'Achternaam',
                  locale: 'nl-NL',
                },
              ],
            },
            email: {
              value_type: 'string',
              display: [
                {
                  name: 'Email',
                },
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
            type: {
              value_type: 'string',
              display: [
                {
                  name: 'Type',
                },
                {
                  name: 'Type',
                  locale: 'en-US',
                },
                {
                  name: 'Type',
                  locale: 'nl-NL',
                },
              ],
            },
          },
          id: 'triall2023',
          types: ['VerifiableCredential', 'GuestCredential'],
          format: 'jwt_vc_json',
          cryptographic_binding_methods_supported: ['did:web', 'did:jwk'],
          cryptographic_suites_supported: ['ES256', 'ES256K', 'EdDSA'],
        },
      ],
    } as IssuerMetadata,
  },
]

console.log(JSON.stringify(importMetadatas, null, 2))

const agent = createAgent<IPlugins>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new SphereonKeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new SphereonKeyManagementSystem(privateKeyStore),
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
          idOpts: {
            identifier: RP_DID_JWK,
            kid: '4c6d87db1d9d597377b82a99a6a175cac00f4150c910dfc7f8232d6e08dbf8d8',
          },
        },
      },
      instanceOpts: [
        {
          credentialIssuer: `${baseUrl}/sphereonDISABLED`,
          issuerOpts: {
            didOpts: {
              idOpts: {
                identifier: RP_DID_ION,
                kid: RP_DID_ION_KID,
              },
            },
          },
        },
      ],
      importIssuerOpts: [
        {
          correlationId: `${baseUrl}/sphereonDISABLED`,
          issuerOpts: {
            didOpts: {
              idOpts: {
                identifier: RP_DID_ION,
                kid: RP_DID_ION_KID,
              },
            },
          },
        },
      ],

      importMetadatas: importMetadatas,
    }),
    new OID4VCIIssuer({
      resolveOpts: {
        resolver,
      },
    }),
    new CredentialPlugin(),
    new CredentialHandlerLDLocal({
      contextMaps: [LdDefaultContexts],
      suites: [new SphereonEd25519Signature2018(), new SphereonEd25519Signature2020(), new SphereonJsonWebSignature2020()],
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
      `==DID JWK existed:  \r\n${JSON.stringify(id, null, 2)}\r\nJWK:\r\n${JSON.stringify(toJwk(id.keys[0].publicKeyHex, 'Secp256r1'), null, 2)}`,
    )
  })
  .catch((error) => {
    agent
      .didManagerCreate({
        provider: 'did:jwk',
        alias: 'jwk-es256',
        options: {
          key: {
            type: 'Secp256r1',
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
