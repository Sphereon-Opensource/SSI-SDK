import { JwkDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-jwk'
import { WebDIDProvider } from '@sphereon/ssi-sdk-ext.did-provider-web'
import { getDidJwkResolver } from '@sphereon/ssi-sdk-ext.did-resolver-jwk'
import { IdentifierResolution, IIdentifierResolution } from '@sphereon/ssi-sdk-ext.identifier-resolution'
import { SphereonKeyManager } from '@sphereon/ssi-sdk-ext.key-manager'
import { calculateJwkThumbprint, toJwkFromKey } from '@sphereon/ssi-sdk-ext.key-utils'
import { SphereonKeyManagementSystem } from '@sphereon/ssi-sdk-ext.kms-local'
import { createAgent, IDIDManager, IKeyManager, TAgent } from '@veramo/core'
import { DIDStore, Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { SecretBox } from '@veramo/kms-local'
import { OrPromise } from '@veramo/utils'
import { Resolver } from 'did-resolver'
import { describe } from 'node:test'
import { DataSource } from 'typeorm'
import { beforeAll, expect, it } from 'vitest'
import { getResolver as getWebDidResolver } from 'web-did-resolver'
import { IJwtService, JwtService } from '../src'

const KMS_SECRET_KEY = 'd17c8674f5db9396f8eecccde25e882bb0336316bc411ae38dc1f3dcd7ed100f'
let databaseFile = ':memory:'
let dbConnection: OrPromise<DataSource>
let agent: TAgent<IKeyManager & IDIDManager & IIdentifierResolution & IJwtService>

const DID_METHOD = 'did:jwk'

const jwkDIDProvider = new JwkDIDProvider({
  defaultKms: 'mem',
})

const setup = async () => {
  const db: DataSource = await new DataSource({
    type: 'sqlite',
    database: databaseFile,
    synchronize: false,
    logging: ['info', 'warn'],
    entities: [...Entities],
    migrations: [...migrations],
    migrationsRun: true,
  }).initialize()
  const secretBox = new SecretBox(KMS_SECRET_KEY)

  const localAgent = await createAgent<IKeyManager & IDIDManager & IIdentifierResolution & IJwtService>({
    plugins: [
      new SphereonKeyManager({
        store: new KeyStore(db),
        kms: {
          local: new SphereonKeyManagementSystem(new PrivateKeyStore(db, secretBox)),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({ ...getDidJwkResolver(), ...getWebDidResolver() }),
      }),
      new DIDManager({
        providers: {
          [DID_METHOD]: jwkDIDProvider,
          'did:web': new WebDIDProvider({
            defaultKms: 'local',
          }),
        },
        defaultProvider: DID_METHOD,
        store: new DIDStore(db),
      }),
      new IdentifierResolution(),
      new JwtService(),
    ],
  })
  agent = localAgent
  dbConnection = db
  return agent
}

const tearDown = async (): Promise<boolean> => {
  await (await dbConnection).destroy()
  return true
}

const getAgent = () => agent

const testContext = { getAgent, setup, tearDown }
type ConfiguredAgent = TAgent<IKeyManager & IDIDManager & IIdentifierResolution & IJwtService>

// let agent: ConfiguredAgent
// let key: IKey

export const PEM_PRIV_KEY =
  '-----BEGIN PRIVATE KEY-----\n' +
  'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDV6x+HCJFKkVgb\n' +
  'eUWy9iCWOFm1J5vNnbODDMasHPjp8m7Pj2zBqdkUsJn62cTENgAI0b6VB/iTtqwy\n' +
  'pdYUQxTajEhnUm/9FeQf8vj8C34OI880PehgeviCQrClWrLzjDccEvoQVSKtz8A1\n' +
  'Yzc3Squw8uQfFKVqPCDKy6nVjhTeDHj9txBJTfomH+WYHpD3sumRXu3GB5xZQGwC\n' +
  '6H23craJpV1Rw3D/z7nFlqlg9AQZwSnjvI+LE4nZKZemhHaJOm9krhk3IXcnGopC\n' +
  'DakYmpVtWi+2FLB3FCQ6oXbWhtB3oiIly8OacdLEujoOIcEZgRjEk7zc9KRNjdfK\n' +
  'HvJkwCRTAgMBAAECggEBAJV2aFrSs6EkGClp/DbkHTSYPqWB/SwWyXwBCzbqL0hW\n' +
  'KPJAxb4yTAhWs98/FGn7SN7gnYZHQXkDoyDoGcGidQmWBmiagsCT8QYZn7mK1hJP\n' +
  'FtDriFcQ1F0+92kxC+N6zm6BG9MZiNdkVml23vd05q0FqDnHFSQ6yramwg0B7raN\n' +
  'PQ7sg7CY087aMeyjKkISG1kin0JJdfRwYQBtdmpsvhjVhXteBqiyXhyg/Xkrt6+5\n' +
  'K4PH1BgEgvg7vODPVfs7ZApyzZPeD0Gf5+Chxg1JVkGvxc1pLAveTHH94NNQHlts\n' +
  '+KooVRRhPB5zmdIJGOODp9qjcK+Jjd4kJC80hgBuUDECgYEA9JjPr8ewBGgtaQKm\n' +
  'e59+MWBRqzdcNRk+P5MH1TBB99jhwjhQNWGvUs0j4f9+1sULMun/OL+v0Osr2L1f\n' +
  'TDDEnSEBk4wEiv8QX+PmbGCs3qBp5c75V1J3q3N2Nsd64NCLv1YIP+U9lnsMapUy\n' +
  'w6RN8HQq1Y8DDo2G5VREsWYhSY0CgYEA3+Qsf1mNB2Y6fbVi2EDSy5tdkCyPKFUY\n' +
  'Sy58VVaoA8td8StjUk0FhHYwaoo63GFOuvtJTF/MRl8IMbgXQFBhKXsVqVVl1KS9\n' +
  'gg+maVlZDDLvmSlinF8Wo46FkdVeBW/PWXrbb5l7v9yu9eqWkqvXNzelkRy11Z7U\n' +
  'Sw4NCI5sfV8CgYBEnc29gSZWxibfC5hKm96Z2WxvvLMITlGRIh0TaFtJPTVv975A\n' +
  'i2vUranAT510gIh4uv4XHGclE6QURGPEivXNIqI/kwr/NziPve45PxGfzp6Gkn6O\n' +
  'SZs6pMRn76QAB2D8xxS/X/7cBR7hk4NPMPuQVfZiPKFd5sQN94rhvUXfTQKBgQC5\n' +
  'xA+rprjeP9MeRKb7+WUtrP6HxoENnPVoQ+zDvf/wDggnN7HUMrX2Pz5S19iYzGBP\n' +
  'wnoB1aafaPBamH0qTscfbNH/Sy0Pr5TR2nxgAtNgzM6CTZVVW4xkLrfi1Z+KcUgg\n' +
  '3VA/G6FTAx9kSb2fetc6KIDGk4TH91373G+x/sJDjwKBgQDfMzwxV+XoYfwbtNuR\n' +
  'DGKLXcv/SB8O0DbEp/KlF/85DLDFy7RPwCNRc44N9007U0XEjnKMus0XUqwE+0go\n' +
  'KcMDfw3m+PjempOVqnQLB6JgiHfrVwQGq6JVY90fGH9rnAs+muxxSHxWmZqRQ2oO\n' +
  'dtonyvREV44ngrwe4nGK8O5N4A==\n' +
  '-----END PRIVATE KEY-----'

export const PEM_CERT =
  '-----BEGIN CERTIFICATE-----\n' +
  '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\n' +
  '1zNHGxNMFnI=\n' +
  '-----END CERTIFICATE-----'
export const PEM_CHAIN =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/bWLiWnX1owDQYJKoZIhvcNAQELBQAw\n' +
  'TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n' +
  'cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjAwOTA0MDAwMDAw\n' +
  'WhcNMjUwOTE1MTYwMDAwWjAyMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg\n' +
  'RW5jcnlwdDELMAkGA1UEAxMCUjMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK\n' +
  'AoIBAQC7AhUozPaglNMPEuyNVZLD+ILxmaZ6QoinXSaqtSu5xUyxr45r+XXIo9cP\n' +
  'R5QUVTVXjJ6oojkZ9YI8QqlObvU7wy7bjcCwXPNZOOftz2nwWgsbvsCUJCWH+jdx\n' +
  'sxPnHKzhm+/b5DtFUkWWqcFTzjTIUu61ru2P3mBw4qVUq7ZtDpelQDRrK9O8Zutm\n' +
  'NHz6a4uPVymZ+DAXXbpyb/uBxa3Shlg9F8fnCbvxK/eG3MHacV3URuPMrSXBiLxg\n' +
  'Z3Vms/EY96Jc5lP/Ooi2R6X/ExjqmAl3P51T+c8B5fWmcBcUr2Ok/5mzk53cU6cG\n' +
  '/kiFHaFpriV1uxPMUgP17VGhi9sVAgMBAAGjggEIMIIBBDAOBgNVHQ8BAf8EBAMC\n' +
  'AYYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMBIGA1UdEwEB/wQIMAYB\n' +
  'Af8CAQAwHQYDVR0OBBYEFBQusxe3WFbLrlAJQOYfr52LFMLGMB8GA1UdIwQYMBaA\n' +
  'FHm0WeZ7tuXkAXOACIjIGlj26ZtuMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcw\n' +
  'AoYWaHR0cDovL3gxLmkubGVuY3Iub3JnLzAnBgNVHR8EIDAeMBygGqAYhhZodHRw\n' +
  'Oi8veDEuYy5sZW5jci5vcmcvMCIGA1UdIAQbMBkwCAYGZ4EMAQIBMA0GCysGAQQB\n' +
  'gt8TAQEBMA0GCSqGSIb3DQEBCwUAA4ICAQCFyk5HPqP3hUSFvNVneLKYY611TR6W\n' +
  'PTNlclQtgaDqw+34IL9fzLdwALduO/ZelN7kIJ+m74uyA+eitRY8kc607TkC53wl\n' +
  'ikfmZW4/RvTZ8M6UK+5UzhK8jCdLuMGYL6KvzXGRSgi3yLgjewQtCPkIVz6D2QQz\n' +
  'CkcheAmCJ8MqyJu5zlzyZMjAvnnAT45tRAxekrsu94sQ4egdRCnbWSDtY7kh+BIm\n' +
  'lJNXoB1lBMEKIq4QDUOXoRgffuDghje1WrG9ML+Hbisq/yFOGwXD9RiX8F6sw6W4\n' +
  'avAuvDszue5L3sz85K+EC4Y/wFVDNvZo4TYXao6Z0f+lQKc0t8DQYzk1OXVu8rp2\n' +
  'yJMC6alLbBfODALZvYH7n7do1AZls4I9d1P4jnkDrQoxB3UqQ9hVl3LEKQ73xF1O\n' +
  'yK5GhDDX8oVfGKF5u+decIsH4YaTw7mP3GFxJSqv3+0lUFJoi5Lc5da149p90Ids\n' +
  'hCExroL1+7mryIkXPeFM5TgO9r0rvZaBFOvV2z0gp35Z0+L4WPlbuEjN/lxPFin+\n' +
  'HlUjr8gRsI3qfJOQFy/9rKIJR0Y/8Omwt/8oTWgy1mdeHmmjk7j1nYsvC9JSQ6Zv\n' +
  'MldlTTKB3zhThV1+XWYp6rjd5JW1zbVWEkLNxE7GJThEUG3szgBVGP7pSWTUTsqX\n' +
  'nLRbwHOoq7hHwg==\n' +
  '-----END CERTIFICATE-----\n' +
  '\n' +
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/\n' +
  'MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT\n' +
  'DkRTVCBSb290IENBIFgzMB4XDTIxMDEyMDE5MTQwM1oXDTI0MDkzMDE4MTQwM1ow\n' +
  'TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n' +
  'cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwggIiMA0GCSqGSIb3DQEB\n' +
  'AQUAA4ICDwAwggIKAoICAQCt6CRz9BQ385ueK1coHIe+3LffOJCMbjzmV6B493XC\n' +
  'ov71am72AE8o295ohmxEk7axY/0UEmu/H9LqMZshftEzPLpI9d1537O4/xLxIZpL\n' +
  'wYqGcWlKZmZsj348cL+tKSIG8+TA5oCu4kuPt5l+lAOf00eXfJlII1PoOK5PCm+D\n' +
  'LtFJV4yAdLbaL9A4jXsDcCEbdfIwPPqPrt3aY6vrFk/CjhFLfs8L6P+1dy70sntK\n' +
  '4EwSJQxwjQMpoOFTJOwT2e4ZvxCzSow/iaNhUd6shweU9GNx7C7ib1uYgeGJXDR5\n' +
  'bHbvO5BieebbpJovJsXQEOEO3tkQjhb7t/eo98flAgeYjzYIlefiN5YNNnWe+w5y\n' +
  'sR2bvAP5SQXYgd0FtCrWQemsAXaVCg/Y39W9Eh81LygXbNKYwagJZHduRze6zqxZ\n' +
  'Xmidf3LWicUGQSk+WT7dJvUkyRGnWqNMQB9GoZm1pzpRboY7nn1ypxIFeFntPlF4\n' +
  'FQsDj43QLwWyPntKHEtzBRL8xurgUBN8Q5N0s8p0544fAQjQMNRbcTa0B7rBMDBc\n' +
  'SLeCO5imfWCKoqMpgsy6vYMEG6KDA0Gh1gXxG8K28Kh8hjtGqEgqiNx2mna/H2ql\n' +
  'PRmP6zjzZN7IKw0KKP/32+IVQtQi0Cdd4Xn+GOdwiK1O5tmLOsbdJ1Fu/7xk9TND\n' +
  'TwIDAQABo4IBRjCCAUIwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYw\n' +
  'SwYIKwYBBQUHAQEEPzA9MDsGCCsGAQUFBzAChi9odHRwOi8vYXBwcy5pZGVudHJ1\n' +
  'c3QuY29tL3Jvb3RzL2RzdHJvb3RjYXgzLnA3YzAfBgNVHSMEGDAWgBTEp7Gkeyxx\n' +
  '+tvhS5B1/8QVYIWJEDBUBgNVHSAETTBLMAgGBmeBDAECATA/BgsrBgEEAYLfEwEB\n' +
  'ATAwMC4GCCsGAQUFBwIBFiJodHRwOi8vY3BzLnJvb3QteDEubGV0c2VuY3J5cHQu\n' +
  'b3JnMDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jcmwuaWRlbnRydXN0LmNvbS9E\n' +
  'U1RST09UQ0FYM0NSTC5jcmwwHQYDVR0OBBYEFHm0WeZ7tuXkAXOACIjIGlj26Ztu\n' +
  'MA0GCSqGSIb3DQEBCwUAA4IBAQAKcwBslm7/DlLQrt2M51oGrS+o44+/yQoDFVDC\n' +
  '5WxCu2+b9LRPwkSICHXM6webFGJueN7sJ7o5XPWioW5WlHAQU7G75K/QosMrAdSW\n' +
  '9MUgNTP52GE24HGNtLi1qoJFlcDyqSMo59ahy2cI2qBDLKobkx/J3vWraV0T9VuG\n' +
  'WCLKTVXkcGdtwlfFRjlBz4pYg1htmf5X6DYO8A4jqv2Il9DjXA6USbW1FzXSLr9O\n' +
  'he8Y4IWS6wY7bCkjCWDcRQJMEhg76fsO3txE+FiYruq9RUWhiF1myv4Q6W+CyBFC\n' +
  'Dfvp7OOGAN6dEOM4+qR9sdjoSYKEBpsr6GtPAQw4dy753ec5\n' +
  '-----END CERTIFICATE-----'
const DID_WEB_DID = 'did:web:localhost:es256'

describe('Local integration tests', () => {
  beforeAll(async () => {
    const agent = await testContext.setup()
    await agent.didManagerCreate({
      provider: 'did:web',
      alias: DID_WEB_DID,
      options: {
        keys: [
          {
            key: {
              type: 'RSA',
              kid: DID_WEB_DID,
            },
            x509: {
              certPEM: PEM_CERT,
              privateKeyPEM: PEM_PRIV_KEY,
              certificateChainPEM: PEM_CHAIN,
            },
          },
        ],
      },
    })
    // await agent.keyManagerImport({ kid: 'test', type: 'Secp256r1', kms: 'local', privateKeyHex })
  })
  // afterAll(testContext.tearDown)

  describe('jwt-service', () => {
    it('should verify with ietf jwk', async () => {
      /*  const jwt = await agent.jwtCreateJwsCompactSignature({
          // Example payloads from IETF spec
          issuer: { identifier: kid, noIdentifierInHeader: true },
          protectedHeader: { alg: 'ES256' },
          payload: 'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ',
        })*/

      const identifier = (await agent.didManagerFind({ alias: DID_WEB_DID }))[0]
      const jwk = toJwkFromKey(identifier.keys[0])

      console.log(`Initial JWK: ${JSON.stringify(jwk, null, 2)}`)
      const signature = await agent.jwtCreateJwsCompactSignature({
        issuer: { method: 'jwk', identifier: jwk },
        protectedHeader: { /*alg: "PS256",*/ kid: calculateJwkThumbprint({ jwk }) },
        payload: { test: 'test' },
      })

      const result = await agent.jwtVerifyJwsSignature({ jws: signature.jwt })
      expect(result).toMatchObject({
        critical: false,
        error: false,
        message: 'Signature validated',
        name: 'jws',
        // verificationTime: expect.any(Date),
      })
    })
  })
})
