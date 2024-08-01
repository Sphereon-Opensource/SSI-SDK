// import { IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk'
import { getUniResolver } from '@sphereon/did-uni-client'
import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { EntraIDAuth, ExpressBuilder, IBearerStrategyOptionWithRequest } from '@sphereon/ssi-express-support'
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

// import passport from 'passport'
import { getResolver as getDidWebResolver } from 'web-did-resolver'
import { UniResolverApiServer } from '../src'
import { DidWebServer } from '../src/did-web-server'

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
// const PUBLIC_KEY_HEX = '89a4661e446b46401325a38d3b20582d1dd277eb448a3181012a671b7ae15837'

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

const agent = createAgent<IDIDManager & IKeyManager & IDataStoreORM & IResolver>({
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

agent.dataStoreORMGetIdentifiers().then((ids) => ids.forEach((id) => console.log(JSON.stringify(id, null, 2))))

// Set the Azure AD B2C options
const options: IBearerStrategyOptionWithRequest = {
  identityMetadata: `https://${config.metadata.authority}/${config.credentials.tenantName}.onmicrosoft.com/${config.metadata.version}/${config.metadata.discovery}`,
  clientID: config.credentials.clientID,
  audience: config.credentials.clientID,
  issuer: config.credentials.issuer,
  // policyName: config.policies.policyName,
  // isB2C: config.settings.isB2C,
  // scope: config.resource.scope,
  validateIssuer: config.settings.validateIssuer,
  loggingLevel: config.settings.loggingLevel as 'info' | 'warn' | 'error' | undefined,
  passReqToCallback: config.settings.passReqToCallback,
}

const strategy = 'sphereon-entra-demo-client'
EntraIDAuth.init(strategy).withOptions(options).connectPassport()
/*

passport.serializeUser(function (user: Express.User, done: (err: any, id?: any) => void) {
  console.log(`serializeUser: ${JSON.stringify(user)}`)
  done(null, user)
})

passport.deserializeUser(function (user: Express.User, done: (err: any, user?: Express.User | false | null) => void) {
  console.log(`deserializeUser: ${JSON.stringify(user)}`)
  done(null, user)
})

*/

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
  .then((value) => {
    debug(`IDENTIFIER: ${value.did}`)
  })
  .catch((reason) => {
    console.log(`error on creation:  ${reason}`)
  })
  .finally(() => {
    const builder = ExpressBuilder.fromServerOpts({
      port: 5000,
      // envVarPrefix: 'DID_API_',
      hostname: '0.0.0.0',
    })
      .withPassportAuth(false)
      .withMorganLogging({ format: 'dev' })
    // .withSessionOptions({secret: '1234', name: 'oidc-session'})
    const expressSupport = builder.build({ startListening: false })

    new UniResolverApiServer({
      opts: {
        enableFeatures: ['did-persist', 'did-resolve'],
        endpointOpts: {
          globalAuth: {
            authentication: {
              enabled: true,
              strategy,
            },
          },
          resolveDid: {
            disableGlobalAuth: true,
          },
          getDidMethods: {
            disableGlobalAuth: true,
          },
        },
      },
      expressSupport: expressSupport,
      agent,
    })

    new DidWebServer({
      opts: {
        enableFeatures: ['did-web-global-resolution'],
        globalAuth: {
          authentication: {
            enabled: false,
            strategy,
          },
        },
        endpointOpts: {},
      },
      expressSupport,
      agent,
    })
    expressSupport.start()
  })

export default agent
