import { CreateRequestObjectMode, getIssuerName } from '@sphereon/oid4vci-common'
import { toJwk } from '@sphereon/ssi-sdk-ext.key-utils'
import { createObjects, getConfig } from '@sphereon/ssi-sdk.agent-config'
import { IContactManager } from '@sphereon/ssi-sdk.contact-manager'
import {
  ConnectionType,
  CorrelationIdentifierType,
  CredentialRole,
  IdentityOrigin,
  NonPersistedParty,
  Party,
  PartyOrigin,
  PartyTypeType,
} from '@sphereon/ssi-sdk.data-store'
import {
  IOID4VCIHolder,
  OID4VCICallbackStateListener,
  OID4VCIMachine,
  OID4VCIMachineEvents,
  OID4VCIMachineInterpreter,
  OID4VCIMachineState,
  OID4VCIMachineStates,
} from '@sphereon/ssi-sdk.oid4vci-holder'
import { IPresentationExchange } from '@sphereon/ssi-sdk.presentation-exchange'
import {
  IDidAuthSiopOpAuthenticator,
  OID4VPCallbackStateListener,
  Siopv2MachineInterpreter,
  Siopv2MachineState,
  Siopv2MachineStates,
} from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth'
import { Siopv2OID4VPLinkHandler } from '@sphereon/ssi-sdk.siopv2-oid4vp-op-auth/dist/link-handler'
import { IDIDManager, IIdentifier, IKeyManager, IResolver, MinimalImportableKey, TAgent } from '@veramo/core'
// @ts-ignore
import cors from 'cors'

import fetch from 'cross-fetch'

// @ts-ignore
import express, { Express } from 'express'
import { Server } from 'http'
import { DataSource } from 'typeorm'
import { AttestationAuthRequestUrlResult, ebsiCreateAttestationAuthRequestURL } from '../src/functions'
import { SupportedDidMethodEnum } from '@sphereon/ssi-sdk-ext.did-utils'

let dbConnection: Promise<DataSource>
let agent: TAgent<IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IPresentationExchange & IOID4VCIHolder & IResolver & IContactManager>
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
const secp256k1Jwk = toJwk(secp256k1PrivateKey.privateKeyHex, 'Secp256k1', { isPrivateKey: true })

const secp256r1PrivateKey: MinimalImportableKey = {
  privateKeyHex: 'f0710a0bb80c28a14ae62831bfe7f90a6937d006295fad6115e5539e7e314ee4',
  kms: 'local',
  type: 'Secp256r1',
  meta: {
    purposes: ['assertionMethod', 'authentication'],
  },
}

const secp256r1Jwk = toJwk(secp256r1PrivateKey.privateKeyHex, 'Secp256r1', { isPrivateKey: true })
let vpLinkHandler: Siopv2OID4VPLinkHandler
let authReqResult: AttestationAuthRequestUrlResult
let oid4vciMachine: OID4VCIMachine
const MOCK_BASE_URL = 'https://ebsi-sphereon.ngrok.dev' // `http://localhost:${port}`
jest.setTimeout(600000)

const setup = async (): Promise<boolean> => {
  const config = await getConfig('packages/ebsi-authorization-client/agent.yml')
  const { localAgent, db } = await createObjects(config, { localAgent: '/agent', db: '/dbConnection' })
  agent = localAgent as TAgent<
    IKeyManager & IDIDManager & IDidAuthSiopOpAuthenticator & IPresentationExchange & IOID4VCIHolder & IResolver & IContactManager
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
    res.send({ hello: 'world' })
  })

  app.get('/.well-known/jwks', async (req: express.Request, res: express.Response) => {
    res.send({ keys: [{ ...secp256k1Jwk }, { ...secp256r1Jwk }] })
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

describe.skip('attestation client should', () => {
  let identifier: IIdentifier

  beforeAll(async (): Promise<void> => {
    await setup()
    identifier = await agent.didManagerCreate({
      provider: 'did:ebsi',
      options: { secp256k1Key: secp256k1PrivateKey, secp256r1Key: secp256r1PrivateKey },
    })
    console.log(identifier.did)
  })

  afterAll(async (): Promise<void> => {
    await tearDown()
  })

  it('get attestation to onboard', async () => {
    const clientId = MOCK_BASE_URL
    authReqResult = await ebsiCreateAttestationAuthRequestURL(
      {
        credentialType: 'VerifiableAuthorisationToOnboard',
        formats: ['jwt_vc_json'],
        redirectUri: `${MOCK_BASE_URL}`,
        clientId,
        idOpts: { identifier },
        credentialIssuer: 'http://192.168.2.90:3000/conformance/v3/issuer-mock',
        //credentialIssuer: 'https://conformance-test.ebsi.eu/conformance/v3/issuer-mock',
        requestObjectOpts: {
          iss: clientId,
          requestObjectMode: CreateRequestObjectMode.REQUEST_OBJECT,
          jwksUri: `${MOCK_BASE_URL}/.well-known/jwks`,
        },
      },
      { agent },
    )

    console.log(authReqResult)

    const addContact = async (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState) => {
      const { serverMetadata, hasContactConsent, contactAlias } = state.context

      if (!serverMetadata) {
        return Promise.reject(Error('Missing serverMetadata in context'))
      }

      const issuerUrl: URL = new URL(serverMetadata.issuer)
      const correlationId: string = `${issuerUrl.protocol}//${issuerUrl.hostname}`
      let issuerName: string = getIssuerName(correlationId, serverMetadata.credentialIssuerMetadata)

      const party: NonPersistedParty = {
        contact: {
          displayName: issuerName,
          legalName: issuerName,
        },
        // FIXME maybe its nicer if we can also just use the id only
        // TODO using the predefined party type from the contact migrations here
        // TODO this is not used as the screen itself adds one, look at the params of the screen, this is not being passed in
        partyType: {
          id: '3875c12e-fdaa-4ef6-a340-c936e054b627',
          origin: PartyOrigin.EXTERNAL,
          type: PartyTypeType.ORGANIZATION,
          name: 'Sphereon_default_type',
          tenantId: '95e09cfc-c974-4174-86aa-7bf1d5251fb4',
        },
        uri: correlationId,
        identities: [
          {
            alias: correlationId,
            roles: [CredentialRole.ISSUER],
            origin: IdentityOrigin.EXTERNAL,
            identifier: {
              type: CorrelationIdentifierType.URL,
              correlationId: issuerUrl.hostname,
            },
            // TODO WAL-476 add support for correct connection
            connection: {
              type: ConnectionType.OPENID_CONNECT,
              config: {
                clientId: '138d7bf8-c930-4c6e-b928-97d3a4928b01',
                clientSecret: '03b3955f-d020-4f2a-8a27-4e452d4e27a0',
                scopes: ['auth'],
                issuer: 'https://example.com/app-test',
                redirectUrl: 'app:/callback',
                dangerouslyAllowInsecureHttpRequests: true,
                clientAuthMethod: 'post' as const,
              },
            },
          },
        ],
      }

      const onCreate = async ({
        party,
        issuerUrl,
        issuerName,
        correlationId,
      }: {
        party: NonPersistedParty
        issuerUrl: string
        issuerName: string
        correlationId: string
      }): Promise<void> => {
        const displayName = party.contact.displayName ?? issuerName
        const contacts: Array<Party> = await agent.cmGetContacts({
          filter: [
            {
              contact: {
                // Searching on legalName as displayName is not unique, and we only support organizations for now
                legalName: displayName,
              },
            },
          ],
        })
        if (contacts.length === 0 || !contacts[0]?.contact) {
          const contact = await agent.cmAddContact({
            ...party,
            displayName,
            legalName: displayName,
            contactType: {
              type: PartyTypeType.ORGANIZATION,
              name: displayName,
              origin: PartyOrigin.EXTERNAL,
              tenantId: party.tenantId ?? '1',
            },
          })
          oid4vciMachine.send({
            type: OID4VCIMachineEvents.CREATE_CONTACT,
            data: contact,
          })
        }
      }

      const onConsentChange = async (hasConsent: boolean): Promise<void> => {
        oid4vciMachine.send({
          type: OID4VCIMachineEvents.SET_CONTACT_CONSENT,
          data: hasConsent,
        })
      }

      const onAliasChange = async (alias: string): Promise<void> => {
        oid4vciMachine.send({
          type: OID4VCIMachineEvents.SET_CONTACT_ALIAS,
          data: alias,
        })
      }

      if (!issuerName) {
        issuerName = `EBSI unknown (${issuerUrl})`
      } else if (issuerName.startsWith('http')) {
        issuerName = `EBSI ${issuerName.replace(/https?:\/\//, '')}`
      }
      if (!contactAlias) {
        return await onAliasChange(issuerName)
      }
      issuerName = contactAlias
      if (!hasContactConsent) {
        return await onConsentChange(true)
      }
      await onCreate({ party, issuerName, issuerUrl: issuerUrl.toString(), correlationId })
    }

    const vciStateCallbacks = new Map<
      OID4VCIMachineStates,
      (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState) => Promise<void>
    >()
    vciStateCallbacks.set(OID4VCIMachineStates.addContact, addContact)
    vciStateCallbacks.set(OID4VCIMachineStates.selectCredentials, selectCredentials)
    vciStateCallbacks.set(OID4VCIMachineStates.initiateAuthorizationRequest, authorizationCodeUrl)

    const vpStateCallbacks = new Map<Siopv2MachineStates, (oid4vpMachine: Siopv2MachineInterpreter, state: Siopv2MachineState) => Promise<void>>()
    vpStateCallbacks.set(Siopv2MachineStates.done, siopDone)
    vpLinkHandler = new Siopv2OID4VPLinkHandler({
      protocols: ['openid:'],
      // @ts-ignore
      context: { agent },
      noStateMachinePersistence: true,
      stateNavigationListener: OID4VPCallbackStateListener(vpStateCallbacks),
    })

    oid4vciMachine = await agent.oid4vciHolderGetMachineInterpreter({
      ...authReqResult,
      issuanceOpt: {
        identifier,
        didMethod: SupportedDidMethodEnum.DID_EBSI,
      },
      didMethodPreferences: [SupportedDidMethodEnum.DID_EBSI, SupportedDidMethodEnum.DID_KEY],
      stateNavigationListener: OID4VCICallbackStateListener(vciStateCallbacks),
    })

    /*const oid4vpMachine = await agent.siopGetMachineInterpreter({
            stateNavigationListener: OID4VPCallbackStateListener(vpStateCallbacks),
        })
*/
    const interpreter = oid4vciMachine.interpreter
    interpreter.start()

    await new Promise((resolve) => setTimeout(resolve, 30000))

    console.log(JSON.stringify(interpreter.getSnapshot().value, null, 2))
  })
})

const selectCredentials = async (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState) => {
  const { contact, credentialToSelectFrom, selectedCredentials } = state.context

  if (selectedCredentials && selectedCredentials.length > 0) {
    console.log(`selected: ${selectedCredentials.join(', ')}`)
    oid4vciMachine.send({
      type: OID4VCIMachineEvents.NEXT,
    })
    return
  } else if (!contact) {
    return Promise.reject(Error('Missing contact in context'))
  }

  const onSelectType = async (selectedCredentials: Array<string>): Promise<void> => {
    console.log(`Selected credentials: ${selectedCredentials.join(', ')}`)
    oid4vciMachine.send({
      type: OID4VCIMachineEvents.SET_SELECTED_CREDENTIALS,
      data: selectedCredentials,
    })
  }

  await onSelectType(credentialToSelectFrom.map((sel) => sel.credentialId))
}

const authorizationCodeUrl = async (oid4vciMachine: OID4VCIMachineInterpreter, state: OID4VCIMachineState) => {
  const url = state.context.authorizationCodeURL
  console.log('navigateAuthorizationCodeURL: ', url)
  if (!url) {
    return Promise.reject(Error('Missing authorization URL in context'))
  }
  const onOpenAuthorizationUrl = async (url: string): Promise<void> => {
    console.log('onOpenAuthorizationUrl being invoked: ', url)
    oid4vciMachine.send({
      type: OID4VCIMachineEvents.INVOKED_AUTHORIZATION_CODE_REQUEST,
      data: url,
    })
    const response = await fetch(url, { redirect: 'manual' })
    if (response.status < 301 || response.status > 302) {
      throw Error(`When doing a headless auth, we expect to be redirected on getting the authz URL`)
    }
    const openidUri = response.headers.get('location')
    if (!openidUri || !openidUri.startsWith('openid://')) {
      throw Error(
        `Expected a openid:// URI to be returned from EBSI in headless mode. Returned: ${openidUri}, ${JSON.stringify(await response.text())}`,
      )
    }

    console.log(`onOpenAuthorizationUrl after openUrl: ${url}`)
    const kid = authReqResult.authKey.meta?.jwkThumbprint
      ? `${authReqResult.identifier.did}#${authReqResult.authKey.meta.jwkThumbprint}`
      : authReqResult.authKey.kid
    await vpLinkHandler.handle(openidUri, { idOpts: { identifier: authReqResult.identifier, kid } })
  }
  await onOpenAuthorizationUrl(url)
}

const siopDone = async (oid4vpMachine: Siopv2MachineInterpreter, state: Siopv2MachineState) => {
  // console.log('SIOP result:')
  // console.log(JSON.stringify(state.context, null , 2))
  if (!state.context.authorizationResponseData?.queryParams?.code) {
    throw Error(`No code was returned from the authorization step`)
  }
  oid4vciMachine.interpreter.send({
    type: OID4VCIMachineEvents.PROVIDE_AUTHORIZATION_CODE_RESPONSE,
    data: state.context.authorizationResponseData.url!,
  })
}
