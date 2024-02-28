import { DataSource } from 'typeorm'
import { DataStoreDigitalCredentialMigrations } from '../migrations'
import { DataStoreDigitalCredentialEntities, DigitalCredentialEntity } from '../index'
import { DigitalCredentialStore } from '../digitalCredential/DigitalCredentialStore'
import { CredentialCorrelationType, CredentialStateType, CredentialType, DigitalCredential } from '../types/digitalCredential/digitalCredential'
import { AddDigitalCredentialArgs, GetDigitalCredentialsArgs } from '../types/digitalCredential/IAbstractDigitalCredentialStore'
import { IVerifiablePresentation } from '@sphereon/ssi-types'

describe('Database entities tests', (): void => {
  let dbConnection: DataSource
  let digitalCredentialStore: DigitalCredentialStore

  beforeEach(async (): Promise<void> => {
    dbConnection = await new DataSource({
      type: 'sqlite',
      database: ':memory:',
      //logging: 'all',
      migrationsRun: false,
      migrations: DataStoreDigitalCredentialMigrations,
      synchronize: false,
      entities: DataStoreDigitalCredentialEntities,
    }).initialize()
    await dbConnection.runMigrations()
    expect(await dbConnection.showMigrations()).toBeFalsy()
    digitalCredentialStore = new DigitalCredentialStore(dbConnection)
  })

  afterEach(async (): Promise<void> => {
    await (await dbConnection).destroy()
  })

  it('should store digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddDigitalCredentialArgs = {
      raw: rawCredential,
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addDigitalCredential(digitalCredential)
    expect(savedDigitalCredential).toBeDefined()
  })

  it('should get all digital credentials', async (): Promise<void> => {
    const addCredentialArgs1: AddDigitalCredentialArgs = {
      raw: 'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }
    const addCredentialArgs2: AddDigitalCredentialArgs = {
      raw: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDkyMTQxNzgsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiY3JlZGVudGlhbFN1YmplY3QiOnsiZmlyc3ROYW1lIjoiUyIsImxhc3ROYW1lIjoiSyIsIkUtbWFpbCI6IiIsInR5cGUiOiJTcGhlcmVvbiBHdWVzdCIsImlkIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEifX0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJHdWVzdENyZWRlbnRpYWwiXSwiZXhwaXJhdGlvbkRhdGUiOiIyMDI0LTAyLTI5VDEzOjQyOjU4LjgzNVoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiRS1tYWlsIjoiIiwidHlwZSI6IlNwaGVyZW9uIEd1ZXN0IiwiaWQiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOa3NpTENKMWMyVWlPaUp6YVdjaUxDSnJkSGtpT2lKRlF5SXNJbU55ZGlJNkluTmxZM0F5TlRack1TSXNJbmdpT2lKV2NYaEhlWFZSTlZRMFdUSnNkakpIWTJsT1NpMURhREJVYUZWbWRWTlFabTB0UlhWU1lsZE1aVU4zSWl3aWVTSTZJbTVPUVZCcGJHRXlUMFE0ZFc5cFduTktWbVpSYWtsMlMxRlRlbEF6UWpWUFdtVlJiRWhDVVRseWJUUWlmUSJ9LCJpc3N1ZXIiOiJkaWQ6andrOmV5SmhiR2NpT2lKRlV6STFOaUlzSW5WelpTSTZJbk5wWnlJc0ltdDBlU0k2SWtWRElpd2lZM0oySWpvaVVDMHlOVFlpTENKNElqb2lWRWN5U0RKNE1tUlhXRTR6ZFVOeFduQnhSakY1YzBGUVVWWkVTa1ZPWDBndFEwMTBZbWRxWWkxT1p5SXNJbmtpT2lJNVRUaE9lR1F3VUU0eU1rMDViRkJFZUdSd1JIQnZWRXg2TVRWM1pubGFTbk0yV21oTFNWVktNek00SW4wIiwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wMi0yMlQxMzo0Mjo1OC44MzVaIiwic3ViIjoiZGlkOmp3azpleUpoYkdjaU9pSkZVekkxTmtzaUxDSjFjMlVpT2lKemFXY2lMQ0pyZEhraU9pSkZReUlzSW1OeWRpSTZJbk5sWTNBeU5UWnJNU0lzSW5naU9pSldjWGhIZVhWUk5WUTBXVEpzZGpKSFkybE9TaTFEYURCVWFGVm1kVk5RWm0wdFJYVlNZbGRNWlVOM0lpd2llU0k2SW01T1FWQnBiR0V5VDBRNGRXOXBXbk5LVm1aUmFrbDJTMUZUZWxBelFqVlBXbVZSYkVoQ1VUbHliVFFpZlEiLCJuYmYiOjE3MDg2MDkzNzgsImlzcyI6ImRpZDpqd2s6ZXlKaGJHY2lPaUpGVXpJMU5pSXNJblZ6WlNJNkluTnBaeUlzSW10MGVTSTZJa1ZESWl3aVkzSjJJam9pVUMweU5UWWlMQ0o0SWpvaVZFY3lTREo0TW1SWFdFNHpkVU54V25CeFJqRjVjMEZRVVZaRVNrVk9YMGd0UTAxMFltZHFZaTFPWnlJc0lua2lPaUk1VFRoT2VHUXdVRTR5TWswNWJGQkVlR1J3UkhCdlZFeDZNVFYzWm5sYVNuTTJXbWhMU1ZWS016TTRJbjAifQ.GgLRWHO674wu6QF_xUGbCi_2zDD8jNf_xoWNvH5K605xvBoz6qKx0ndmxLeGQWWUA-4VuAkznf3ROcp9wpgbEw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const digitalCredential1: DigitalCredential = await digitalCredentialStore.addDigitalCredential(addCredentialArgs1)
    expect(digitalCredential1).toBeDefined()
    const digitalCredential2: DigitalCredential = await digitalCredentialStore.addDigitalCredential(addCredentialArgs2)
    expect(digitalCredential2).toBeDefined()

    const result: Array<DigitalCredential> = await digitalCredentialStore.getDigitalCredentials()
    expect(result.length).toEqual(2)
  })

  it('should get digital credentials by filter', async (): Promise<void> => {
    const addCredentialArgs1: AddDigitalCredentialArgs = {
      raw: 'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw',
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const sampleVP: IVerifiablePresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
          id: 'https://example.com/credentials/1872',
          type: ['VerifiableCredential', 'IDCardCredential'],
          issuer: {
            id: 'did:example:issuer',
          },
          issuanceDate: '2010-01-01T19:23:24Z',
          credentialSubject: {
            given_name: 'Fredrik',
            family_name: 'Strömberg',
            birthdate: '1949-01-22',
          },
          proof: {
            type: 'Ed25519Signature2018',
            created: '2021-03-19T15:30:15Z',
            jws: 'eyJhb...IAoDA',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#keys-1',
          },
        },
      ],
      id: 'ebc6f1c2',
      holder: 'did:example:holder',
      proof: {
        type: 'Ed25519Signature2018',
        created: '2021-03-19T15:30:15Z',
        challenge: 'n-0S6_WzA2Mj',
        domain: 'https://client.example.org/cb',
        jws: 'eyJhb...JQdBw',
        proofPurpose: 'authentication',
        verificationMethod: 'did:example:holder#key-1',
      },
    }
    const addCredentialArgs2: AddDigitalCredentialArgs = {
      raw: JSON.stringify(sampleVP),
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
      issuerCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:example:holder',
      subjectCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationId: 'did:example:holder',
    }
    const savedDigitalCredential1: DigitalCredential = await digitalCredentialStore.addDigitalCredential(addCredentialArgs1)
    expect(savedDigitalCredential1).toBeDefined()
    const savedDigitalCredential2: DigitalCredential = await digitalCredentialStore.addDigitalCredential(addCredentialArgs2)
    expect(savedDigitalCredential2).toBeDefined()
    const args: GetDigitalCredentialsArgs = {
      filter: [{ credentialType: CredentialType.VP }],
    }
    const result: Array<DigitalCredentialEntity> = await digitalCredentialStore.getDigitalCredentials(args)

    expect(result.length).toEqual(1)
  })

  it('should return no digital credentials if filter does not match', async (): Promise<void> => {
    const args: GetDigitalCredentialsArgs = {
      filter: [{ issuerCorrelationId: 'unknown_id' }],
    }
    const result: Array<DigitalCredentialEntity> = await digitalCredentialStore.getDigitalCredentials(args)

    expect(result.length).toEqual(0)
  })

  it('should delete stored digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddDigitalCredentialArgs = {
      raw: rawCredential,
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addDigitalCredential(digitalCredential)
    let result = await digitalCredentialStore.removeDigitalCredential({ id: savedDigitalCredential.id })
    expect(result).toEqual(true)
  })

  it('should not delete stored digital credential if id not found', async (): Promise<void> => {
    const result = await digitalCredentialStore.removeDigitalCredential({ id: 'unknown_id' })
    expect(result).toEqual(false)
  })

  it('should update stored digital credential', async (): Promise<void> => {
    const rawCredential: string =
      'eyJraWQiOiJkaWQ6a2V5Ono2TWtyaGt5M3B1c20yNk1laUZhWFUzbjJuZWtyYW13RlVtZ0dyZUdHa0RWNnpRaiN6Nk1rcmhreTNwdXNtMjZNZWlGYVhVM24ybmVrcmFtd0ZVbWdHcmVHR2tEVjZ6UWoiLCJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc3BoZXJlb24tb3BlbnNvdXJjZS5naXRodWIuaW8vc3NpLW1vYmlsZS13YWxsZXQvY29udGV4dC9zcGhlcmVvbi13YWxsZXQtaWRlbnRpdHktdjEuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJTcGhlcmVvbldhbGxldElkZW50aXR5Q3JlZGVudGlhbCJdLCJjcmVkZW50aWFsU3ViamVjdCI6eyJmaXJzdE5hbWUiOiJTIiwibGFzdE5hbWUiOiJLIiwiZW1haWxBZGRyZXNzIjoic0BrIn19LCJzdWIiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJqdGkiOiJ1cm46dXVpZDpkZGE3YmYyNC04ZTdhLTQxZjgtYjY2Yy1hNDhkYmM1YjEwZmEiLCJuYmYiOjE3MDg0NDA4MDgsImlzcyI6ImRpZDprZXk6ejZNa3Joa3kzcHVzbTI2TWVpRmFYVTNuMm5la3JhbXdGVW1nR3JlR0drRFY2elFqIn0.G0M84XVAxSmzGY-NQuB9NBofNrINSn6lvxW6761Vlq6ypvYgtc2xNdpiRmw8ryVNfnpzrr4Z5cB1RlrC05rJAw'
    const digitalCredential: AddDigitalCredentialArgs = {
      raw: rawCredential,
      issuerCorrelationType: CredentialCorrelationType.DID,
      subjectCorrelationType: CredentialCorrelationType.DID,
      issuerCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      subjectCorrelationId: 'did:key:z6Mkrhky3pusm26MeiFaXU3n2nekramwFUmgGreGGkDV6zQj',
      tenantId: 'urn:uuid:nnag4b43-1e7a-98f8-a32c-a48dbc5b10mj',
    }

    const savedDigitalCredential: DigitalCredential = await digitalCredentialStore.addDigitalCredential(digitalCredential)

    const result = await digitalCredentialStore.updateDigitalCredentialState({
      id: savedDigitalCredential.id,
      verifiedState: CredentialStateType.REVOKED,
    })
    expect(result.verifiedState).toEqual(CredentialStateType.REVOKED)
  })
})
