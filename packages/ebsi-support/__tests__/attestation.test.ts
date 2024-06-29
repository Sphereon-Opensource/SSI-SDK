import {CreateRequestObjectMode} from '@sphereon/oid4vci-common'
import {toJwk} from '@sphereon/ssi-sdk-ext.key-utils'
import {createObjects, getConfig} from '@sphereon/ssi-sdk.agent-config'
import {IContactManager} from '@sphereon/ssi-sdk.contact-manager'
import {IOID4VCIHolder} from '@sphereon/ssi-sdk.oid4vci-holder'
import {IPresentationExchange} from '@sphereon/ssi-sdk.presentation-exchange'
import {IDidAuthSiopOpAuthenticator} from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import {IDIDManager, IIdentifier, IKeyManager, IResolver, MinimalImportableKey, TAgent} from '@veramo/core'
// @ts-ignore
import cors from 'cors'

// @ts-ignore
import express, {Express} from 'express'
import {Server} from 'http'
import {DataSource} from 'typeorm'
import {IEbsiSupport} from '../src'
import {AttestationAuthRequestUrlResult} from '../src/functions'

let dbConnection: Promise<DataSource>
let agent: TAgent<
    IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IPresentationExchange & IOID4VCIHolder & IResolver & IContactManager & IEbsiSupport
>
let app: Express | undefined
let server: Server<any, any> | undefined
const port = 3333
const secp256k1PrivateKey: MinimalImportableKey = {
    privateKeyHex: '6e491660cf923f7d9ce4a03401444b361817df9e76b926b55e21ffe7144d2ee6',
    kms: 'local',
    type: 'Secp256k1',
    meta: {
        purposes: ['capabilityInvocation'],
    },
}
const secp256k1Jwk = toJwk(secp256k1PrivateKey.privateKeyHex, 'Secp256k1', {isPrivateKey: true})

const secp256r1PrivateKey: MinimalImportableKey = {
    privateKeyHex: 'f0710a0bb80c28a14ae62831bfe7f90a6937d006295fad6115e5539e7e314ee4',
    kms: 'local',
    type: 'Secp256r1',
    meta: {
        purposes: ['assertionMethod', 'authentication'],
    },
}

const secp256r1Jwk = toJwk(secp256r1PrivateKey.privateKeyHex, 'Secp256r1', {isPrivateKey: true})
let authReqResult: AttestationAuthRequestUrlResult
const MOCK_BASE_URL = 'https://ebsi-sphereon.ngrok.dev' // `http://localhost:${port}`
jest.setTimeout(600000)

const setup = async (): Promise<boolean> => {
    const config = await getConfig('packages/ebsi-support/agent.yml')
    const {localAgent, db} = await createObjects(config, {localAgent: '/agent', db: '/dbConnection'})
    agent = localAgent as TAgent<
        IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IPresentationExchange & IOID4VCIHolder & IResolver & IContactManager & IEbsiSupport
    >
    dbConnection = db

    app = express()
    app.use(
        cors({
            origin: ['*'],
        }),
    )
    app.use(express.json())

    app.get('/', async (req: express.Request, res: express.Response) => {
        res.send({hello: 'world'})
    })

    app.get('/.well-known/jwks', async (req: express.Request, res: express.Response) => {
        res.send({keys: [{...secp256k1Jwk}, {...secp256r1Jwk}]})
    })

    console.log(`########## $${MOCK_BASE_URL}`)

    server = app.listen(port, () => {
        console.log(`Mock server is listening to port ${port}`)
    })

    return true
}

const tearDown = async (): Promise<boolean> => {
    if (server) {
        server.closeAllConnections()
    }

    if (dbConnection && false) {
        ;(await dbConnection)?.close()
    }
    return true
}

describe('attestation client should', () => {
    let identifier: IIdentifier

    beforeAll(async (): Promise<void> => {
        await setup()
        identifier = await agent.didManagerCreate({
            provider: 'did:ebsi',
            options: {secp256k1Key: secp256k1PrivateKey, secp256r1Key: secp256r1PrivateKey},
        })
        console.log(identifier.did)
    })

    afterAll(async (): Promise<void> => {
        await tearDown()
    })

    it('get attestation to onboard', async () => {
        const clientId = MOCK_BASE_URL
        authReqResult = await agent.ebsiCreateAttestationAuthRequestURL({
            credentialType: 'VerifiableAuthorisationToOnboard',
            formats: ['jwt_vc_json'],
            redirectUri: `${MOCK_BASE_URL}`,
            clientId,
            idOpts: {identifier},
            // credentialIssuer: 'http://192.168.2.90:3000/conformance/v3/issuer-mock',
            credentialIssuer: 'https://api-conformance.ebsi.eu/conformance/v3/issuer-mock',
            requestObjectOpts: {
                iss: clientId,
                requestObjectMode: CreateRequestObjectMode.REQUEST_OBJECT,
                jwksUri: `${MOCK_BASE_URL}/.well-known/jwks`,
            },
        })
        const attestationResult = await agent.ebsiGetAttestation({clientId, authReqResult})

        console.log('=========== CREDENTIALS:')
        console.log(attestationResult.credentials)

        console.log('=========== CONTEXT CREDS TO ACCEPT:')
        console.log(attestationResult)


        const accessToken = await agent.ebsiAccessTokenGet({
            // attestationCredential: CredentialMapper.storedCredentialToOriginalFormat(attestationResult.credentials[0].rawVerifiableCredential as OriginalVerifiableCredential),
            jwksUri: `${MOCK_BASE_URL}/.well-known/jwks`,
            scope: 'didr_invite',
            idOpts: {identifier, kid: secp256r1Jwk.kid},
            redirectUri: `${MOCK_BASE_URL}`,
            credentialIssuer: 'https://api-conformance.ebsi.eu/conformance/v3/issuer-mock',
            clientId,
            apiOpts: {environment: "conformance", mock: 'auth-mock', type: 'openid-configuration'}
        })
      console.log(JSON.stringify(accessToken))
    })
})
