// import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'
import { getUniResolver } from '@sphereon/did-uni-client'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { ExpressBuilder } from '@sphereon/ssi-sdk.express-support'
import { createAgent, IDataStore, IDataStoreORM, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
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

import morgan from 'morgan'

import passport from 'passport'
import { ITokenPayload, VerifyCallback } from 'passport-azure-ad/common'

import { getResolver as getDidWebResolver } from 'web-did-resolver'
import { UniResolverApiServer } from '../src'

import config from './config.json'
import { DB_CONNECTION_NAME, DB_ENCRYPTION_KEY, getDbConnection } from './database'

const debug = Debug('sphereon:did-uniresolver')

export const DIF_UNIRESOLVER_RESOLVE_URL = 'https://dev.uniresolver.io/1.0/identifiers'
// export const APP_ID = 'sphereon:rp-demo'
export const DID_PREFIX = 'did'

export enum KeyManagementSystemEnum {
  LOCAL = 'local',
}

export enum SupportedDidMethodEnum {
  DID_ETHR = 'ethr',
  DID_KEY = 'key',
  // DID_LTO = 'lto',
  DID_ION = 'ion',
  DID_WEB = 'web',
  DID_JWK = 'jwk',
}

const PRIVATE_KEY_HEX =
  'ea6aaeebe17557e0fe256bfce08e8224a412ea1e25a5ec8b5d69618a58bad89e89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'
const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'

export const resolver = new Resolver({
  ...getUniResolver('ethr', {
    resolveUrl: DIF_UNIRESOLVER_RESOLVE_URL,
  }),
  ...getDidWebResolver(),
  ...getDidKeyResolver(),
  ...getDidJwkResolver(),
  ...getDidIonResolver(),
})

export const didProviders = {
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_WEB}`]: new WebDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
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
  [`${DID_PREFIX}:${SupportedDidMethodEnum.DID_JWK}`]: new JwkDIDProvider({
    defaultKms: KeyManagementSystemEnum.LOCAL,
  }),
}

const dbConnection = getDbConnection(DB_CONNECTION_NAME)
const privateKeyStore: PrivateKeyStore = new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))

const agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
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
  ],
})

// let keyRef = "did:ion:EiAeobpQwEVpR-Ib9toYwbISQZZGIBck6zIUm0ZDmm9v0g:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJhdXRoLWtleSIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJmUUE3WUpNRk1qNXFET0RrS25qR1ZLNW0za1VSRFc1YnJ1TWhUa1NYSGQwIiwieSI6IlI3cVBNNEsxWHlqNkprM3M2a3I2aFNrQzlDa0ExSEFpMVFTejZqSU56dFkifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJhc3NlcnRpb25NZXRob2QiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpQnpwN1loTjltaFVjWnNGZHhuZi1sd2tSVS1oVmJCdFpXc1ZvSkhWNmprd0EifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUJvbWxvZ0JPOERROFdpVVFsa3diYmxuMXpsRFU2Q3Jvc01wNDRySjYzWHhBIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlEQVFYU2k3SGNqSlZCWUFLZE8yenJNNEhmeWJtQkJDV3NsNlBRUEpfamtsQSJ9fQ"

// agent.didManagerImport({did: RP_DID, keys: })
agent.dataStoreORMGetIdentifiers().then((ids) => ids.forEach((id) => console.log(JSON.stringify(id, null, 2))))

// Import the passport Azure AD library
const BearerStrategy = require('passport-azure-ad').BearerStrategy

// Set the Azure AD B2C options
const options = {
  identityMetadata: `https://${config.metadata.authority}/${config.credentials.tenantName}.onmicrosoft.com/${config.metadata.version}/${config.metadata.discovery}`,
  clientID: config.credentials.clientID,
  audience: config.credentials.clientID,
  issuer: config.credentials.issuer,
  // policyName: config.policies.policyName,
  // isB2C: config.settings.isB2C,
  // scope: config.resource.scope,
  validateIssuer: config.settings.validateIssuer,
  loggingLevel: config.settings.loggingLevel,
  passReqToCallback: config.settings.passReqToCallback,
}

// Instantiate the passport Azure AD library with the Azure AD B2C options
const bearerStrategy = new BearerStrategy(options, (token: ITokenPayload, done: VerifyCallback) => {
  // Send user info using the second argument
  done(null, {}, token)
})
passport.use(bearerStrategy)
passport.serializeUser(function (user: Express.User, done: (err: any, id?: any) => void) {
  done(null, user)
})

passport.deserializeUser(function (user: Express.User, done: (err: any, user?: Express.User | false | null) => void) {
  done(null, user)
})

agent
  .didManagerCreate({
    provider: 'did:jwk',
    alias: 'test',
    options: {
      type: 'Ed25519',
      key: {
        privateKeyHex: PRIVATE_KEY_HEX,
      },
    },
  })
  /*.didManagerCreate({
          provider: 'did:ion',
          alias: RP_DID,
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
                  privateKeyHex: RP_PRIVATE_KEY_HEX,
                },
                purposes: [IonPublicKeyPurpose.Authentication, IonPublicKeyPurpose.AssertionMethod],
              },
            ],
          },
        })*/
  .then((value) => {
    debug(`IDENTIFIER: ${value.did}`)
  })
  .catch((reason) => {
    console.log(`error on creation:  ${reason}`)
  })
  .finally(() => {
    const builder = ExpressBuilder.fromServerOpts({
      port: 5000,
      envVarPrefix: 'DID_API_',
      hostname: '0.0.0.0',
    }).withPassportAuth(false)
    // .withSessionOptions({secret: '1234', name: 'oidc-session'})
    // .addHandler(morgan('dev'))
    const expressArgs = builder.build({ startListening: true })
    expressArgs.express.use(morgan('dev'))
    // expressArgs.express.use(passport.initialize())

    new UniResolverApiServer({
      opts: {
        endpointOpts: {
          globalAuth: {
            authentication: {
              enabled: false,
              strategy: bearerStrategy,
            },
          },
        },
      },
      expressArgs,
      agent,
    })
    // builder.startListening(expressArgs.express)
  })

export default agent
